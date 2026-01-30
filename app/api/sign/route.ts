import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";
import { getResend } from "@/lib/mail/resendClient";

async function sendResendEmail(opts: { to: string[]; subject: string; html: string; text?: string }) {
  // Usamos el SDK oficial (mismo approach que magic-link), y mantenemos compatibilidad de env vars existentes.
  const resend = getResend();
  const from =
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM ||
    process.env.RESEND_SENDER ||
    "Firma Electrónica Simple <onboarding@resend.dev>";

  const out = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  // El SDK devuelve { data, error }
  const anyOut: any = out as any;
  if (anyOut?.error) {
    throw new Error(`Resend error: ${anyOut.error?.message || String(anyOut.error)}`.slice(0, 3000));
  }

  return anyOut?.data;
}

export const runtime = "nodejs";

const BodySchema = z.object({
  token: z.string(),
  signatureDataUrl: z.string(),
  consent: z.boolean(),
  signer: z.object({
    fullName: z.string(),
    dni: z.string(),
    cuil: z.string(),
    address: z.string(),
    phone: z.string(),
  }),
});

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function dataUrlToPngBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

function randomAuditCode() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

function normalizeEmail(v: unknown): string {
  return String(v || "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  // simple + robusto para Resend (evita espacios y valores no-email)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


async function downloadBytes(admin: any, bucket: string, path: string) {
  const dl = await admin.storage.from(bucket).download(path);
  if (dl.error || !dl.data) throw new Error("Failed to download file");
  const ab = await dl.data.arrayBuffer();
  return new Uint8Array(ab);
}

async function generateQrPngBytes(url: string) {
  const dataUrl = await QRCode.toDataURL(url, { margin: 0, width: 256 });
  return dataUrlToPngBytes(dataUrl);
}

async function generateFinalPdfBytes(opts: {
  admin: any;
  bucket: string;
  originalPath: string;
  documentId: string;
  title: string;
  completedAt: string;
  signers: Array<{ signature_path: string; full_name: string; dni: string }>;
}) {
  const { admin, bucket, originalPath, documentId, title, completedAt, signers } = opts;

  const originalBytes = await downloadBytes(admin, bucket, originalPath);
  const pdfDoc = await PDFDocument.load(originalBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // generar audit code
  const auditCode = randomAuditCode();

  // Agregar una página de evidencia / constancia
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  page.drawText("Constancia de firma", { x: 36, y: 800, size: 16, font });

  page.drawText(`Documento: ${title}`, { x: 36, y: 770, size: 11, font });
  page.drawText(`Finalizado: ${new Date(completedAt).toLocaleString()}`, { x: 36, y: 750, size: 11, font });
  page.drawText(`Código de auditoría: ${auditCode}`, { x: 36, y: 730, size: 11, font });

  // QR hacia /v/<audit_code>
  const verifyUrl = `https://firmasimple.vercel.app/v/${encodeURIComponent(auditCode)}`;
  const qrBytes = await generateQrPngBytes(verifyUrl);
  const qrImg = await pdfDoc.embedPng(qrBytes);

  page.drawText("Verificación pública:", { x: 36, y: 700, size: 11, font });
  page.drawText(verifyUrl, { x: 36, y: 684, size: 9, font, color: rgb(0, 0, 0.8) });

  page.drawImage(qrImg, { x: 480, y: 690, width: 80, height: 80 });

  let y = 640;

  // firmas (se reduce el tamaño para que no quede grotesca)
  for (const s of signers) {
    const sigBytes = await downloadBytes(admin, bucket, s.signature_path);
    const sigImg = await pdfDoc.embedPng(sigBytes);

    const w = 140; // antes era más grande; achicamos aprox 50%
    const h = (sigImg.height / sigImg.width) * w;

    // firma
    page.drawImage(sigImg, { x: 36, y, width: w, height: h });

    // aclaración debajo de la firma (evitar solaparse con header de constancia)
    page.drawText(`${s.full_name}`, { x: 36, y: y - 14, size: 10, font });
    page.drawText(`DNI: ${s.dni}`, { x: 36, y: y - 28, size: 10, font });

    y -= h + 52;
    if (y < 120) {
      y = 740;
      const np = pdfDoc.addPage([595, 842]);
      (page as any) = np;
    }
  }

  // Marca electrónica en todas las páginas
  const pages = pdfDoc.getPages();
  for (const p of pages) {
    p.drawText(`Marca Electrónica FES • Doc ${documentId}`, {
      x: 36,
      y: 20,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  const finalBytes = await pdfDoc.save();
  const finalHashSha256 = crypto.createHash("sha256").update(Buffer.from(finalBytes)).digest("hex");

  return { finalBytes, auditCode, finalHashSha256 };
}

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    if (!body.consent) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1) Buscar signing_request por token
    const srRes = await admin
      .from("signing_requests")
      .select("*")
      .eq("token", body.token)
      .maybeSingle();

    if (srRes.error || !srRes.data) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }

    const sr = srRes.data as any;
    if (sr.status !== "pending") {
      return NextResponse.json({ error: "Link not pending" }, { status: 400 });
    }

    const documentId = String(sr.document_id);

    // 2) Cargar documento
    const docRes = await admin
      .from("documents")
      .select(
        "id, title, created_by, signing_mode, original_path, final_path, total_signers, signed_count, status, completed_at"
      )
      .eq("id", documentId)
      .maybeSingle();

    if (docRes.error || !docRes.data) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = docRes.data as any;

    // 3) Guardar firma PNG en storage
    const signatureBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signaturePath = `${doc.original_path.split("/")[0]}/${documentId}/${sr.id}/signature.png`;

    const upSig = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upSig.error) {
      return NextResponse.json({ error: "Failed to upload signature" }, { status: 500 });
    }

    // 4) Update signer status
    const updSigner = await admin
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
        signer_ip: getIp(req),
      })
      .eq("id", sr.id);

    if (updSigner.error) {
      return NextResponse.json({ error: "Failed to update signer status" }, { status: 500 });
    }

    // 5) Recalcular signed_count
    const signedCountRes = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId)
      .eq("status", "signed");

    const signedCount = Number(signedCountRes.count || 0);

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

        const rawRecipients = [createdByEmail, ...signerEmails].map(normalizeEmail).filter(Boolean);
        const recipients = Array.from(new Set(rawRecipients)).filter(isValidEmail);

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
                  ? `
              <p style="margin:0 0 14px 0;">Descargar PDF final: <a href="${downloadUrl}">Descargar</a> (link válido por 7 días)</p>`
                  : ""
              }
              <hr style="border:none;border-top:1px solid #eee;margin:18px 0" />
              <p style="margin:0;font-size:12px;color:#555">
                Este correo es informativo. Firma Electrónica Simple (FES) implementa firma electrónica (Ley 25.506) y no constituye firma digital certificada.
              </p>
            </div>
          `;

          const sent = await sendResendEmail({
            to: recipients,
            subject,
            html,
            text: `Documento completamente firmado: ${titleForEmail}\nFinalizado: ${new Date(
              completedAtForEmail
            ).toLocaleString()}\nCódigo de auditoría: ${auditCodeForEmail}\nVerificación: ${verifyUrl}${
              downloadUrl ? `\nDescarga: ${downloadUrl}` : ""
            }`,
          });

          // Auditoría: registrar que se envió el aviso final
          try {
            await admin.from("audit_events").insert({
              document_id: documentId,
              event_type: "completion_email_sent",
              actor_email: isValidEmail(createdByEmail) ? createdByEmail : null,
              payload: { to: recipients, subject, resend_id: (sent as any)?.id || null },
            });
          } catch {}
        } else {
          // Auditoría: no había destinatarios válidos (ej: created_by no es email)
          try {
            await admin.from("audit_events").insert({
              document_id: documentId,
              event_type: "completion_email_failed",
              actor_email: null,
              payload: { error: "No valid recipients to send completion email", rawRecipients },
            });
          } catch {}
        }
      } catch (e) {
        console.error("completion email failed:", e);
        // Auditoría: registrar fallo del aviso final (no rompe la firma)
        try {
          await admin.from("audit_events").insert({
            document_id: documentId,
            event_type: "completion_email_failed",
            actor_email: null,
            payload: { error: String((e as any)?.message || e).slice(0, 1500) },
          });
        } catch {}
      }
    }

    return NextResponse.json({ ok: true, status: shouldFinalize ? "finalized" : "signed" });
  } catch (e: any) {
    const status = Number(e?.status || 500);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status });
  }
}
