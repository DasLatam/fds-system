import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().min(10),
  signatureDataUrl: z.string().min(20),
  consent: z.boolean(),
  signer: z.object({
    fullName: z.string().min(3),
    dni: z.string().min(5),
    cuil: z.string().min(8),
    address: z.string().min(5),
    phone: z.string().min(5),
  }),
});

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function dataUrlToPngBytes(dataUrl: string): Uint8Array {
  const m = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!m) throw new Error("Invalid signature format");
  return Uint8Array.from(Buffer.from(m[1], "base64"));
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  return !Number.isNaN(exp) && exp < Date.now();
}

async function downloadBytes(admin: any, bucket: string, path: string): Promise<Uint8Array> {
  const dl = await admin.storage.from(bucket).download(path);
  if (dl.error || !dl.data) throw new Error(`Storage download failed (${path}): ${dl.error?.message}`);
  return new Uint8Array(await dl.data.arrayBuffer());
}

function computeAuditCode(params: {
  documentId: string;
  originalPdfBytes: Uint8Array;
  completedAtIso: string;
}): string {
  const { documentId, originalPdfBytes, completedAtIso } = params;

  // Código determinístico (sirve para mostrar en el PDF).
  // En Sprint 3C, la validación "fuerte" la hacemos contra final_pdf_sha256 (abajo).
  return crypto
    .createHash("sha256")
    .update(Buffer.from(originalPdfBytes))
    .update(documentId)
    .update(completedAtIso)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

async function generateFinalPdfBytes(opts: {
  admin: any;
  bucket: string;
  originalPath: string;
  documentId: string;
  completedAtIso: string;
  signers: Array<{ full_name: string; dni: string; signature_path: string }>;
}) {
  const { admin, bucket, originalPath, documentId, completedAtIso, signers } = opts;

  const originalBytes = await downloadBytes(admin, bucket, originalPath);
  const auditCode = computeAuditCode({ documentId, originalPdfBytes: originalBytes, completedAtIso });

  const pdfDoc = await PDFDocument.load(originalBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const footer = `Marca Electrónica FES • Doc ${documentId.slice(0, 8).toUpperCase()} • Código ${auditCode}`;

  // Footer en todas las páginas
  for (const page of pages) {
    page.drawText(footer, {
      x: 36,
      y: 18,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  // Página final con firmas
  const { width, height } = pages[0].getSize();
  const sigPage = pdfDoc.addPage([width, height]);

  sigPage.drawText("Firmas", { x: 36, y: height - 52, size: 16, font });
  sigPage.drawText(`Código de auditoría: ${auditCode}`, { x: 36, y: height - 74, size: 10, font });

  // Layout: 2 columnas, múltiples filas
  const marginX = 36;
  const gapX = 20;
  const boxW = (width - marginX * 2 - gapX) / 2;

  const sigW = Math.min(260, boxW);
  const sigH = 90;
  const rowH = 150;
  const startY = height - 120;

  for (let i = 0; i < signers.length; i++) {
    const s = signers[i];

    const sigBytes = await downloadBytes(admin, bucket, s.signature_path);
    const sigImg = await pdfDoc.embedPng(sigBytes);

    const col = i % 2;
    const row = Math.floor(i / 2);

    const x = marginX + col * (boxW + gapX);
    const yTop = startY - row * rowH;

    sigPage.drawImage(sigImg, {
      x,
      y: yTop - sigH,
      width: sigW,
      height: sigH,
    });

    sigPage.drawText(`Aclaración: ${(s.full_name || "").trim()}`, {
      x,
      y: yTop - sigH - 18,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    sigPage.drawText(`DNI: ${(s.dni || "").trim()}`, {
      x,
      y: yTop - sigH - 34,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Footer también en la página de firmas
  sigPage.drawText(footer, {
    x: 36,
    y: 18,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const finalBytes = await pdfDoc.save();
  const finalHashSha256 = crypto.createHash("sha256").update(Buffer.from(finalBytes)).digest("hex");

  return { finalBytes, auditCode, finalHashSha256 };
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    if (!body.consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ip = getIp(req);
    const userAgent = req.headers.get("user-agent") || "";

    // 1) Buscar signing request por token (uuid)
    let srRes = await admin
      .from("signing_requests")
      .select("id, document_id, email, status, position, expires_at")
      .eq("token", body.token)
      .maybeSingle();

    // 2) Fallback: por id
    if (!srRes.data && !srRes.error) {
      srRes = await admin
        .from("signing_requests")
        .select("id, document_id, email, status, position, expires_at")
        .eq("id", body.token)
        .maybeSingle();
    }

    if (srRes.error) {
      console.error("signing_requests query error:", srRes.error);
      return NextResponse.json(
        { error: "Signing request query failed", details: srRes.error.message },
        { status: 500 }
      );
    }

    const sr = srRes.data as any;
    if (!sr) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

    if (isExpired(sr.expires_at) && sr.status === "pending") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    if (sr.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 });

    // Documento
    const docRes = await admin
      .from("documents")
      .select(
        "id, title, created_by, signing_mode, original_path, final_path, total_signers, signed_count, status, completed_at"
      )
      .eq("id", sr.document_id)
      .maybeSingle();

    if (docRes.error) {
      console.error("documents query error:", docRes.error);
      return NextResponse.json(
        { error: "Document query failed", details: docRes.error.message },
        { status: 500 }
      );
    }

    const doc = docRes.data as any;
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    if (!doc.original_path) {
      return NextResponse.json({ error: "Document has no original_path" }, { status: 500 });
    }

    // Guardar firma en Storage
    const signatureBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signaturePath = `${doc.created_by}/${doc.id}/signatures/${sr.id}.png`;

    const upSig = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
    });

    if (upSig.error) {
      console.error("signature upload failed:", upSig.error);
      return NextResponse.json(
        { error: "Signature upload failed", details: upSig.error.message },
        { status: 500 }
      );
    }

    // Update signing request -> signed
    const upd = await admin
      .from("signing_requests")
      .update({
        status: "signed",
        signed_at: new Date().toISOString(),
        consented_at: new Date().toISOString(),
        signer_ip: ip,
        signer_user_agent: userAgent,
        signature_path: signaturePath,
        signer_full_name: body.signer.fullName,
        signer_dni: body.signer.dni,
        signer_cuil: body.signer.cuil,
        signer_address: body.signer.address,
        signer_phone: body.signer.phone,
      })
      .eq("id", sr.id);

    if (upd.error) {
      console.error("signing_requests update failed:", upd.error);
      return NextResponse.json(
        { error: "Failed to update signing request", details: upd.error.message },
        { status: 500 }
      );
    }

    // Recalcular signed_count real (robusto ante concurrencia)
    const countRes = await admin
      .from("signing_requests")
      .select("id", { head: true, count: "exact" })
      .eq("document_id", doc.id)
      .eq("status", "signed");

    if (countRes.error) {
      console.error("signed_count recalc failed:", countRes.error);
      return NextResponse.json(
        { error: "Failed to recalc signed_count", details: countRes.error.message },
        { status: 500 }
      );
    }

    const signedCount = countRes.count ?? 0;
    const total = Number(doc.total_signers ?? 0);
    const shouldComplete = total > 0 && signedCount >= total;

    // Siempre actualizamos el contador
    const counterUpd = await admin.from("documents").update({ signed_count: signedCount }).eq("id", doc.id);
    if (counterUpd.error) {
      console.warn("documents signed_count update failed:", counterUpd.error);
      // no frenamos la firma por esto
    }

    // === FINALIZACIÓN (Sprint 3B) ===
    if (shouldComplete) {
      const completedAtIso = new Date().toISOString();
      const finalPath = doc.final_path || `${doc.created_by}/${doc.id}/final/final.pdf`;

      // Traer firmantes firmados con firma
      const signersRes = await admin
        .from("signing_requests")
        .select("signature_path, signer_full_name, signer_dni")
        .eq("document_id", doc.id)
        .eq("status", "signed");

      if (signersRes.error) {
        console.error("load signed signers failed:", signersRes.error);
        return NextResponse.json(
          { error: "Failed to load signed signers", details: signersRes.error.message },
          { status: 500 }
        );
      }

      const signers = (signersRes.data || [])
        .filter((r: any) => !!r.signature_path)
        .map((r: any) => ({
          signature_path: r.signature_path,
          full_name: r.signer_full_name || "",
          dni: r.signer_dni || "",
        }));

      if (signers.length === 0) {
        return NextResponse.json({ error: "No signatures found to finalize PDF" }, { status: 500 });
      }

      // Generar PDF final (marca + firmas)
      const { finalBytes, auditCode, finalHashSha256 } = await generateFinalPdfBytes({
        admin,
        bucket: "fds",
        originalPath: doc.original_path,
        documentId: doc.id,
        completedAtIso,
        signers,
      });

      // Subir final.pdf generado
      const upFinal = await admin.storage.from("fds").upload(finalPath, finalBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

      if (upFinal.error) {
        console.error("finalize upload final failed:", upFinal.error);
        return NextResponse.json(
          { error: "Failed to upload final PDF", details: upFinal.error.message },
          { status: 500 }
        );
      }

      // Setear final_path primero
      if (!doc.final_path) {
        const setFinal = await admin.from("documents").update({ final_path: finalPath }).eq("id", doc.id);
        if (setFinal.error) {
          console.error("final_path update failed:", setFinal.error);
          return NextResponse.json(
            { error: "Failed to set final_path", details: setFinal.error.message },
            { status: 500 }
          );
        }
      }

      // Ahora sí: status signed + completed_at
      const finalizeDoc = await admin
        .from("documents")
        .update({ status: "signed", completed_at: completedAtIso })
        .eq("id", doc.id);

      if (finalizeDoc.error) {
        console.error("documents finalize status failed:", finalizeDoc.error);
        return NextResponse.json(
          { error: "Failed to finalize document status", details: finalizeDoc.error.message },
          { status: 500 }
        );
      }

      // Auditoría
      const auditInsert = await admin.from("audit_events").insert({
        document_id: doc.id,
        signing_request_id: sr.id,
        actor_email: sr.email,
        ip,
        user_agent: userAgent,
        event_type: "pdf_finalized",
        payload: {
          final_path: finalPath,
          audit_code: auditCode,
          final_pdf_sha256: finalHashSha256,
          signed_count: signedCount,
          total_signers: total,
          finalized_at: completedAtIso,
        },
      });

      if (auditInsert.error) {
        console.warn("audit_events insert failed:", auditInsert.error);
        // No frenamos la respuesta: el PDF y el status ya quedaron consistentes
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}