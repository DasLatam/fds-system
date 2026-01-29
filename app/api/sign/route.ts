import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";

const BodySchemaNew = z.object({
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

// Compat: aceptar formato viejo (snake_case) si existe en algún cliente
const BodySchemaOld = z.object({
  token: z.string().min(10),
  signature_data_url: z.string().min(20),
  consent: z.boolean(),
  signer_full_name: z.string().min(3),
  signer_dni: z.string().min(5),
  signer_cuil: z.string().min(8),
  signer_address: z.string().min(5),
  signer_phone: z.string().min(5),
});

type SignBody = z.infer<typeof BodySchemaNew>;

function parseBody(raw: unknown): SignBody {
  const n = BodySchemaNew.safeParse(raw);
  if (n.success) return n.data;

  const o = BodySchemaOld.safeParse(raw);
  if (o.success) {
    return {
      token: o.data.token,
      signatureDataUrl: o.data.signature_data_url,
      consent: o.data.consent,
      signer: {
        fullName: o.data.signer_full_name,
        dni: o.data.signer_dni,
        cuil: o.data.signer_cuil,
        address: o.data.signer_address,
        phone: o.data.signer_phone,
      },
    };
  }

  const err = new Error("Invalid body");
  (err as any).status = 400;
  throw err;
}

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

async function downloadPdfBytes(params: {
  admin: any;
  bucket: string;
  path: string;
}): Promise<Uint8Array> {
  const { admin, bucket, path } = params;
  const dl = await admin.storage.from(bucket).download(path);
  if (dl.error || !dl.data) throw new Error("Failed to download original PDF");
  return new Uint8Array(await dl.data.arrayBuffer());
}

function computeAuditCode(params: {
  documentId: string;
  originalPdfBytes: Uint8Array;
  completedAtIso: string;
}) {
  const { documentId, originalPdfBytes, completedAtIso } = params;
  return crypto
    .createHash("sha256")
    .update(Buffer.from(originalPdfBytes))
    .update(documentId)
    .update(completedAtIso)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

async function generateFinalPdfBytes(params: {
  admin: any;
  bucket: string;
  originalPath: string;
  documentId: string;
  completedAtIso: string;
  signers: Array<{ signature_path: string; full_name: string; dni: string }>;
}) {
  const { admin, bucket, originalPath, documentId, completedAtIso, signers } =
    params;

  const originalPdfBytes = await downloadPdfBytes({
    admin,
    bucket,
    path: originalPath,
  });

  const auditCode = computeAuditCode({
    documentId,
    originalPdfBytes,
    completedAtIso,
  });

  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Footer en todas las páginas
  pages.forEach((page) => {
    const footer = `Marca Electrónica FES • Doc ${documentId
      .slice(0, 8)
      .toUpperCase()} • Código ${auditCode}`;
    page.drawText(footer, {
      x: 36,
      y: 18,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  });

  // Página de firmas (simple)
  const sigPage = pdfDoc.addPage();
  const { width, height } = sigPage.getSize();

  sigPage.drawText("Firmas", {
    x: 36,
    y: height - 48,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  sigPage.drawText(`Código de auditoría: ${auditCode}`, {
    x: 36,
    y: height - 72,
    size: 10,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  let y = height - 120;

  for (const s of signers) {
    const dlSig = await admin.storage.from(bucket).download(s.signature_path);
    if (!dlSig.data) continue;
    const sigBytes = new Uint8Array(await dlSig.data.arrayBuffer());
    const png = await pdfDoc.embedPng(sigBytes);

    const sigW = 220;
    const sigH = (png.height / png.width) * sigW;

    sigPage.drawText(`Aclaración: ${s.full_name}`, {
      x: 36,
      y: y + sigH + 18,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    sigPage.drawText(`DNI: ${s.dni}`, {
      x: 36,
      y: y + sigH + 4,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    sigPage.drawImage(png, {
      x: 36,
      y,
      width: sigW,
      height: sigH,
    });

    y -= sigH + 70;
    if (y < 80) break;
  }

  const footer = `Marca Electrónica FES • Doc ${documentId
    .slice(0, 8)
    .toUpperCase()} • Código ${auditCode}`;
  sigPage.drawText(footer, {
    x: 36,
    y: 18,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const finalBytes = await pdfDoc.save();
  const finalHashSha256 = crypto
    .createHash("sha256")
    .update(Buffer.from(finalBytes))
    .digest("hex");

  return { finalBytes, auditCode, finalHashSha256 };
}

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(await req.json());
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

    if (srRes.error || !srRes.data) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const sr = srRes.data;

    if (sr.status === "signed") {
      return NextResponse.json({ ok: true, alreadySigned: true });
    }

    if (isExpired(sr.expires_at)) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    // 3) Cargar documento
    const docRes = await admin
      .from("documents")
      .select(
        "id, title, created_by, signing_mode, original_path, final_path, total_signers, signed_count, status, completed_at"
      )
      .eq("id", sr.document_id)
      .maybeSingle();

    if (docRes.error || !docRes.data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docRes.data;

    // 4) En modo sequential: validar turno
    if (doc.signing_mode === "sequential") {
      const nextPendingRes = await admin
        .from("signing_requests")
        .select("id, status, position")
        .eq("document_id", doc.id)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1);

      if (nextPendingRes.error) {
        return NextResponse.json(
          { error: "Failed to check sequential order" },
          { status: 500 }
        );
      }

      const next = nextPendingRes.data?.[0];
      if (next && next.id !== sr.id) {
        return NextResponse.json({ error: "Not your turn yet" }, { status: 409 });
      }
    }

    // 5) Subir firma PNG
    const signatureBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signatureHash = crypto
      .createHash("sha256")
      .update(Buffer.from(signatureBytes))
      .digest("hex");

    const signaturePath = `${doc.created_by}/${doc.id}/signatures/${sr.id}.png`;

    const upSig = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600",
    });

    if (upSig.error) {
      return NextResponse.json(
        { error: "Failed to upload signature", details: upSig.error.message },
        { status: 500 }
      );
    }

    // 6) Marcar signing_request como signed
    const nowIso = new Date().toISOString();

    const updSr = await admin
      .from("signing_requests")
      .update({
        status: "signed",
        signed_at: nowIso,
        signer_ip: ip,
        signer_user_agent: userAgent,
        signature_hash: signatureHash,
        signature_path: signaturePath,
        signature_image_sha256: signatureHash,
        signer_full_name: body.signer.fullName,
        signer_dni: body.signer.dni,
        signer_cuil: body.signer.cuil,
        signer_address: body.signer.address,
        signer_phone: body.signer.phone,
        consented_at: nowIso,
        consent_text_version: "v1",
      })
      .eq("id", sr.id);

    if (updSr.error) {
      return NextResponse.json(
        { error: "Failed to update signing request", details: updSr.error.message },
        { status: 500 }
      );
    }

    // 7) Auditoría: firma enviada
    await admin.from("audit_events").insert({
      document_id: doc.id,
      signing_request_id: sr.id,
      actor_email: sr.email,
      ip,
      user_agent: userAgent,
      event_type: "signature_submitted",
      payload: {
        signature_path: signaturePath,
        signature_hash: signatureHash,
        consent_text_version: "v1",
      },
    });

    // 8) Recontar firmados
    const countRes = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("status", "signed");

    const signedCount = countRes.count ?? 0;

    const counterUpd = await admin
      .from("documents")
      .update({ signed_count: signedCount })
      .eq("id", doc.id);

    if (counterUpd.error) {
      console.warn("signed_count update failed:", counterUpd.error);
    }

    const total = doc.total_signers ?? 0;
    const shouldComplete = total > 0 && signedCount >= total;

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

      // Guardar datos para validación pública (/v/<audit_code>)
      const setAudit = await admin
        .from("documents")
        .update({ audit_code: auditCode, final_hash_sha256: finalHashSha256 })
        .eq("id", doc.id);

      if (setAudit.error) {
        console.warn("documents audit_code/final_hash_sha256 update failed:", setAudit.error);
        // No frenamos: el PDF ya quedó firmado y subido. Se puede backfillear si hiciera falta.
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
          final_hash_sha256: finalHashSha256,
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
    const status =
      typeof (e as any)?.status === "number" ? (e as any).status : e?.message === "Invalid body" ? 400 : 500;
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status });
  }
}