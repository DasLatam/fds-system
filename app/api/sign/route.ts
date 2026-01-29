import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string().uuid(),
  signature_data_url: z.string().min(1),
  signer_full_name: z.string().min(2),
  signer_dni: z.string().min(5),
  signer_cuil: z.string().min(5),
  signer_address: z.string().min(5),
  signer_phone: z.string().min(5),
  consent_text_version: z.string().min(1),
});

function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim();
  return req.headers.get("x-real-ip") || "";
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const m = dataUrl.match(/^data:.*?;base64,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  const b64 = m[1];
  const buf = Buffer.from(b64, "base64");
  return new Uint8Array(buf);
}

function safeJson<T>(v: any, fallback: T): T {
  try {
    return v as T;
  } catch {
    return fallback;
  }
}

function computeAuditCode(opts: { documentId: string; originalPdfBytes: Uint8Array; completedAtIso: string }) {
  // código corto y estable (no reversible) para auditoría pública
  const h = crypto
    .createHash("sha256")
    .update(Buffer.from(opts.documentId))
    .update(Buffer.from(opts.originalPdfBytes))
    .update(Buffer.from(opts.completedAtIso))
    .digest("hex");

  return h.slice(0, 16).toUpperCase();
}

async function generateFinalPdfBytes(opts: {
  originalBytes: Uint8Array;
  signaturePngBytes: Uint8Array;
  footerText: string;
}) {
  const pdfDoc = await PDFDocument.load(opts.originalBytes);
  const pages = pdfDoc.getPages();

  // Dibujamos el footer + firma en la última página (simple, estable)
  const last = pages[pages.length - 1];
  const { width, height } = last.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 9;

  // Footer
  last.drawText(opts.footerText, {
    x: 32,
    y: 22,
    size: fontSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Firma (PNG)
  const png = await pdfDoc.embedPng(opts.signaturePngBytes);

  const sigW = 170;
  const sigH = (png.height / png.width) * sigW;

  last.drawImage(png, {
    x: width - sigW - 32,
    y: 34,
    width: sigW,
    height: sigH,
  });

  const finalBytes = await pdfDoc.save();
  const finalHashSha256 = crypto.createHash("sha256").update(Buffer.from(finalBytes)).digest("hex");

  return { finalBytes, finalHashSha256 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();

    const token = parsed.data.token;
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "";

    // Buscar signing_request
    const srRes = await admin
      .from("signing_requests")
      .select(
        "id, token, status, document_id, email, position, signed_at, expires_at, signer_user_agent, signature_path"
      )
      .eq("token", token)
      .maybeSingle();

    if (srRes.error || !srRes.data) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const sr = srRes.data;

    if (sr.status === "signed") {
      return NextResponse.json({ ok: true, alreadySigned: true });
    }

    if (sr.expires_at) {
      const exp = new Date(sr.expires_at).getTime();
      if (!Number.isNaN(exp) && exp < Date.now()) {
        return NextResponse.json({ error: "Link expired" }, { status: 410 });
      }
    }

    // Cargar documento
    const docRes = await admin
      .from("documents")
      .select("id, title, created_by, signing_mode, original_path, final_path, total_signers, signed_count, status, completed_at")
      .eq("id", sr.document_id)
      .maybeSingle();

    if (docRes.error || !docRes.data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docRes.data;

    // En modo sequential: validar turno
    if (doc.signing_mode === "sequential") {
      const pendingRes = await admin
        .from("signing_requests")
        .select("id, position, status")
        .eq("document_id", doc.id)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1);

      if (pendingRes.error) {
        return NextResponse.json({ error: "Failed to check sequential order" }, { status: 500 });
      }

      const next = pendingRes.data?.[0];
      if (next && next.id !== sr.id) {
        return NextResponse.json({ error: "Not your turn yet" }, { status: 409 });
      }
    }

    // Guardar firma (PNG) en storage
    const signatureBytes = dataUrlToBytes(parsed.data.signature_data_url);
    const signatureHash = crypto.createHash("sha256").update(Buffer.from(signatureBytes)).digest("hex");

    const signaturePath = `${doc.created_by}/${doc.id}/signatures/${sr.id}.png`;
    const upSig = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600",
    });

    if (upSig.error) {
      return NextResponse.json({ error: "Failed to upload signature", details: upSig.error.message }, { status: 500 });
    }

    // Actualizar signing_request como signed
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
        signer_full_name: parsed.data.signer_full_name,
        signer_dni: parsed.data.signer_dni,
        signer_cuil: parsed.data.signer_cuil,
        signer_address: parsed.data.signer_address,
        signer_phone: parsed.data.signer_phone,
        consented_at: nowIso,
        consent_text_version: parsed.data.consent_text_version,
      })
      .eq("id", sr.id);

    if (updSr.error) {
      return NextResponse.json({ error: "Failed to update signing request", details: updSr.error.message }, { status: 500 });
    }

    // Auditoría (firma enviada)
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
        consent_text_version: parsed.data.consent_text_version,
      },
    });

    // Recontar firmados
    const countRes = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("status", "signed");

    const signedCount = countRes.count ?? 0;

    const counterUpd = await admin.from("documents").update({ signed_count: signedCount }).eq("id", doc.id);
    if (counterUpd.error) {
      // No bloqueamos por esto; solo warning
      console.warn("signed_count update failed:", counterUpd.error);
    }

    // Si no completó, responder ok
    const total = doc.total_signers ?? 0;
    if (total <= 0 || signedCount < total) {
      return NextResponse.json({ ok: true, signed_count: signedCount, total_signers: total });
    }

    // === Finalizar documento ===
    // Descargar original PDF
    const bucket = "fds";
    const path = doc.original_path;

    const dl = await admin.storage.from(bucket).download(path);
    if (dl.error || !dl.data) {
      return NextResponse.json({ error: "Failed to download original PDF", details: dl.error?.message }, { status: 500 });
    }

    const originalBytes = new Uint8Array(await dl.data.arrayBuffer());

    const completedAtIso = new Date().toISOString();
    const auditCode = computeAuditCode({ documentId: doc.id, originalPdfBytes: originalBytes, completedAtIso });
    const footer = `Marca Electrónica FES • Doc ${doc.id.slice(0, 8).toUpperCase()} • Código ${auditCode}`;

    const { finalBytes, finalHashSha256 } = await generateFinalPdfBytes({
      originalBytes,
      signaturePngBytes: signatureBytes, // (simple: usa última firma). Si querés, luego armamos mosaico de firmas.
      footerText: footer,
    });

    // Subir final.pdf
    const finalPath = doc.final_path || `${doc.created_by}/${doc.id}/final/final.pdf`;
    const upFinal = await admin.storage.from("fds").upload(finalPath, finalBytes, {
      contentType: "application/pdf",
      upsert: true,
      cacheControl: "3600",
    });

    if (upFinal.error) {
      return NextResponse.json({ error: "Failed to upload final PDF", details: upFinal.error.message }, { status: 500 });
    }

    // Setear final_path primero (si no estaba)
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

    // Persistir auditoría pública (verificación /v/<audit_code>)
    const setAudit = await admin
      .from("documents")
      .update({ audit_code: auditCode, final_hash_sha256: finalHashSha256 })
      .eq("id", doc.id);

    if (setAudit.error) {
      console.warn("documents audit_code/final_hash_sha256 update failed:", setAudit.error);
      // No frenamos: el PDF ya quedó firmado. Si falla, se puede backfillear con scripts/backfill-audit.ts
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
