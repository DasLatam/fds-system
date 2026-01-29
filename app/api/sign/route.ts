import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";

async function sendResendEmail(opts: { to: string[]; subject: string; html: string; text?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const from =
    process.env.RESEND_FROM || process.env.RESEND_SENDER || "Firma Electrónica Simple <onboarding@resend.dev>";

  // Resend acepta "to" como string o array
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error: ${res.status} ${res.statusText} ${body}`.slice(0, 3000));
  }
}

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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  return !Number.isNaN(exp) && exp < Date.now();
}

async function downloadPdfBytes(params: { admin: any; bucket: string; path: string }): Promise<Uint8Array> {
  const { admin, bucket, path } = params;
  const dl = await admin.storage.from(bucket).download(path);
  if (dl.error || !dl.data) throw new Error("Failed to download original pdf");
  return new Uint8Array(await dl.data.arrayBuffer());
}

function randomAuditCode() {
  // 12 chars base32-like, uppercase (sin caracteres ambiguos)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(12);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function generateFinalPdfBytes(params: {
  admin: any;
  bucket: string;
  originalPath: string;
  documentId: string;
  title: string;
  completedAt: string; // ISO
  signers: Array<{
    signature_path: string;
    full_name: string;
    dni: string;
  }>;
}) {
  const { admin, bucket, originalPath, documentId, title, completedAt, signers } = params;

  const originalBytes = await downloadPdfBytes({ admin, bucket, path: originalPath });

  const pdfDoc = await PDFDocument.load(originalBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // generar audit code
  const auditCode = randomAuditCode();

  // Agregar una página de evidencia con firmas
  const evidencePageSize: [number, number] = [595.28, 841.89]; // A4
  const sigPage = pdfDoc.addPage(evidencePageSize);
  const pageH = sigPage.getHeight();

  const drawEvidenceHeader = (p: any) => {
    const h = p.getHeight();

    p.drawText("Constancia de evidencia de firma", {
      x: 36,
      y: h - 50,
      size: 16,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });

    p.drawText(`Documento: ${title || "Documento"}`, {
      x: 36,
      y: h - 78,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    p.drawText(`Finalizado: ${new Date(completedAt).toLocaleString()}`, {
      x: 36,
      y: h - 96,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    p.drawText(`Código de auditoría: ${auditCode}`, {
      x: 36,
      y: h - 114,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  };

  drawEvidenceHeader(sigPage);

  // Dibujar firmas (una por firmante)
  let currentPage = sigPage;
  let y = pageH - 160;

  for (const s of signers) {
    // ✅ Si no entra en la página actual, creamos una nueva página de constancia y continuamos
    if (y < 140) {
      currentPage = pdfDoc.addPage(evidencePageSize);
      drawEvidenceHeader(currentPage);
      y = currentPage.getHeight() - 160;
    }

    const dlSig = await admin.storage.from(bucket).download(s.signature_path);
    if (dlSig.error || !dlSig.data) continue;

    const sigBytes = new Uint8Array(await dlSig.data.arrayBuffer());
    const png = await pdfDoc.embedPng(sigBytes);

    // ✅ firma 50% más chica
    const sigW = 220 * 0.5;
    const sigH = (png.height / png.width) * sigW;

    currentPage.drawRectangle({
      x: 36,
      y,
      width: sigW,
      height: sigH,
      borderWidth: 1,
      borderColor: rgb(0.85, 0.85, 0.88),
    });

    currentPage.drawImage(png, {
      x: 36,
      y,
      width: sigW,
      height: sigH,
    });

    // ✅ aclaración debajo de la firma (evita montarse con cabecera)
    const labelY1 = y - 14;
    const labelY2 = y - 28;

    currentPage.drawText(`${s.full_name || "Firmante"}`, {
      x: 36,
      y: labelY1,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    currentPage.drawText(`DNI: ${s.dni}`, {
      x: 36,
      y: labelY2,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    // ✅ dejamos más aire porque ahora hay 2 líneas abajo
    y -= sigH + 90;
  }

  // ✅ QR de verificación pública (/v/<audit_code>)
  try {
    const verifyUrl = `https://firmasimple.vercel.app/v/${auditCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 4,
    });
    const qrImg = await pdfDoc.embedPng(dataUrlToBytes(qrDataUrl));
    const qrSize = 72; // ~1 inch
    const qrX = sigPage.getWidth() - qrSize - 36;
    const qrY = 36;
    sigPage.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  } catch {
    // si falla el QR, no bloquea la firma
  }

  // ✅ Marca electrónica en TODAS las páginas (incluye las originales y la constancia)
  const stamp = `Marca Electrónica FES • Doc ${documentId.slice(0, 8).toUpperCase()} • Código ${auditCode}`;
  for (const p of pdfDoc.getPages()) {
    p.drawText(stamp, {
      x: 36,
      y: 18,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  }

  const finalBytes = await pdfDoc.save();
  const finalHashSha256 = crypto.createHash("sha256").update(Buffer.from(finalBytes)).digest("hex");

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

    if (srRes.error || !srRes.data) {
      return NextResponse.json({ error: "Signing request not found" }, { status: 404 });
    }

    const sr = srRes.data;
    if (sr.status !== "pending") {
      return NextResponse.json({ error: "Signing request is not pending" }, { status: 400 });
    }
    if (isExpired(sr.expires_at)) {
      await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    const documentId = sr.document_id as string;

    // 2) Traer documento y path original
    const docRes = await admin
      .from("documents")
      .select("id, title, status, original_path, final_path, signed_count, total_signers, signing_mode")
      .eq("id", documentId)
      .maybeSingle();

    if (docRes.error || !docRes.data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docRes.data;
    if (!doc.original_path) {
      return NextResponse.json({ error: "Original file missing" }, { status: 500 });
    }

    // 3) Guardar firma como PNG en storage (firma manuscrita)
    const signatureBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signaturePath = `${doc.original_path.split("/")[0]}/${documentId}/${sr.id}/signature.png`;

    const upSig = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upSig.error) {
      return NextResponse.json({ error: "Failed to upload signature" }, { status: 500 });
    }

    // 4) Actualizar signing_request como firmado + guardar datos del firmante
    const nowIso = new Date().toISOString();

    const updSr = await admin
      .from("signing_requests")
      .update({
        status: "signed",
        signed_at: nowIso,
        signature_path: signaturePath,
        signer_full_name: body.signer.fullName,
        signer_dni: body.signer.dni,
        signer_cuil: body.signer.cuil,
        signer_address: body.signer.address,
        signer_phone: body.signer.phone,

        // ✅ columnas reales en DB
        consented_at: nowIso,
        consent_text_version: "v1",

        signer_ip: ip,
        signer_user_agent: userAgent,
      })
      .eq("id", sr.id)
      .select("id, status, signed_at")
      .maybeSingle();

    if (updSr.error) {
      return NextResponse.json({ error: "Failed to update signer status" }, { status: 500 });
    }

    // 5) Recalcular signed_count
    const signedCountRes = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId)
      .eq("status", "signed");

    const signedCount = signedCountRes.count || 0;

    await admin
      .from("documents")
      .update({
        signed_count: signedCount,
      })
      .eq("id", documentId);

    // 6) Si ya firmaron todos, finalizar PDF y marcar documento como signed
    const totalSigners = Number(doc.total_signers || 0);
    const shouldFinalize = totalSigners > 0 && signedCount >= totalSigners;

    if (shouldFinalize) {
      const signersRes = await admin
        .from("signing_requests")
        .select("signature_path, signer_full_name, signer_dni")
        .eq("document_id", documentId)
        .eq("status", "signed")
        .order("position", { ascending: true });

      if (signersRes.error) {
        return NextResponse.json({ error: "Failed to load signers" }, { status: 500 });
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

      // Generar PDF final (marca + firmas + QR)
      const { finalBytes, auditCode, finalHashSha256 } = await generateFinalPdfBytes({
        admin,
        bucket: "fds",
        originalPath: doc.original_path,
        documentId,
        title: doc.title || "Documento",
        completedAt: nowIso,
        signers,
      });

      const finalPath = `${doc.original_path.split("/")[0]}/${documentId}/final/final.pdf`;

      const upFinal = await admin.storage.from("fds").upload(finalPath, finalBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upFinal.error) {
        return NextResponse.json({ error: "Failed to upload final PDF" }, { status: 500 });
      }

      const updDoc = await admin
        .from("documents")
        .update({
          status: "signed",
          final_path: finalPath,
          completed_at: nowIso,
          audit_code: auditCode,
          final_hash_sha256: finalHashSha256,
        })
        .eq("id", documentId);

      if (updDoc.error) {
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
      }

      // ✅ Email automático: documento firmado por todos
      try {
        // creador del documento (documents.created_by suele ser el email)
        const docOwnerRes = await admin
          .from("documents")
          .select("created_by, title, audit_code, final_path, completed_at")
          .eq("id", documentId)
          .maybeSingle();

        const createdByEmail = (docOwnerRes.data as any)?.created_by ? String((docOwnerRes.data as any).created_by) : "";
        const finalPathForEmail = String((docOwnerRes.data as any)?.final_path || finalPath);
        const auditCodeForEmail = String((docOwnerRes.data as any)?.audit_code || auditCode);
        const titleForEmail = String((docOwnerRes.data as any)?.title || doc.title || "Documento");
        const completedAtForEmail = String((docOwnerRes.data as any)?.completed_at || nowIso);

        // firmantes (emails)
        const signersEmailsRes = await admin
          .from("signing_requests")
          .select("email")
          .eq("document_id", documentId);

        const signerEmails = Array.from(
          new Set(
            (signersEmailsRes.data || [])
              .map((r: any) => String(r.email || "").trim().toLowerCase())
              .filter(Boolean)
          )
        );

        const recipients = Array.from(
          new Set([createdByEmail, ...signerEmails].map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))
        );

        if (recipients.length > 0) {
          // link de descarga (signed url por 7 días)
          let downloadUrl = "";
          try {
            const signed = await admin.storage.from("fds").createSignedUrl(finalPathForEmail, 60 * 60 * 24 * 7);
            if (!signed.error && signed.data?.signedUrl) downloadUrl = signed.data.signedUrl;
          } catch {}

          const verifyUrl = `https://firmasimple.vercel.app/v/${encodeURIComponent(auditCodeForEmail)}`;

          const subject = `Documento firmado - ${titleForEmail} - ${new Date(completedAtForEmail).toLocaleString()}`;

          const html = `
            <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;color:#111">
              <h2 style="margin:0 0 8px 0;">Documento completamente firmado</h2>
              <p style="margin:0 0 12px 0;">
                El documento <b>${titleForEmail}</b> fue firmado por todos los firmantes el <b>${new Date(
                  completedAtForEmail
                ).toLocaleString()}</b>.
              </p>
              <p style="margin:0 0 12px 0;">
                Código de auditoría: <b>${auditCodeForEmail}</b>
              </p>
              <p style="margin:0 0 14px 0;">
                Verificación pública: <a href="${verifyUrl}">${verifyUrl}</a>
              </p>
              ${
                downloadUrl
                  ? `<p style="margin:0 0 14px 0;">Descargar PDF final: <a href="${downloadUrl}">Descargar</a> (link válido por 7 días)</p>`
                  : ""
              }
              <hr style="border:none;border-top:1px solid #eee;margin:18px 0" />
              <p style="margin:0;font-size:12px;color:#555">
                Este correo es informativo. Firma Electrónica Simple (FES) implementa firma electrónica (Ley 25.506) y no constituye firma digital certificada.
              </p>
            </div>
          `;

          await sendResendEmail({
            to: recipients,
            subject,
            html,
            text: `Documento completamente firmado: ${titleForEmail}\nFinalizado: ${new Date(
              completedAtForEmail
            ).toLocaleString()}\nCódigo de auditoría: ${auditCodeForEmail}\nVerificación: ${verifyUrl}${
              downloadUrl ? `\nDescarga: ${downloadUrl}` : ""
            }`,
          });
        }
      } catch (e) {
        console.error("completion email failed:", e);
      }
    }

    return NextResponse.json({ ok: true, status: shouldFinalize ? "finalized" : "signed" });
  } catch (e: any) {
    const status = Number(e?.status || 500);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status });
  }
}