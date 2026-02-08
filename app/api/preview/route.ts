import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import crypto from "crypto";
import { getResend } from "@/lib/mail/resendClient";
import { baseEmailTemplate } from "@/lib/mail/templates/base";

export const runtime = "nodejs";

async function sendResendEmail(opts: { to: string[]; subject: string; html: string; text?: string }) {
  // Usamos el SDK oficial (mismo approach que magic-link), y mantenemos compatibilidad mínima.
  const resend = getResend();

  // Resend SDK espera `to` como string[] o string
  const to = opts.to;

  const res = await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if ((res as any)?.error) {
    const msg = (res as any).error?.message || "Resend error";
    const e = new Error(msg);
    (e as any).resend = res;
    throw e;
  }

  return res;
}

function isValidEmail(v?: string | null) {
  if (!v) return false;
  const s = String(v).trim();
  if (!s.includes("@")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function logAuditBasic(
  admin: any,
  evt: { document_id: string; event_type: string; actor_email?: string | null }
) {
  try {
    const r = await admin.from("audit_events").insert({
      document_id: evt.document_id,
      event_type: evt.event_type,
      actor_email: evt.actor_email ?? null,
    });
    if (r?.error) {
      console.error("audit_events insert failed:", evt.event_type, r.error);
    }
  } catch (e) {
    console.error("audit_events insert failed:", evt.event_type, e);
  }
}

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return null;
}

function dataUrlToPngBytes(dataUrl: string): Uint8Array {
  const m = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!m) throw new Error("Invalid signature dataUrl");
  return Uint8Array.from(Buffer.from(m[1], "base64"));
}

function sha256Hex(bytes: Uint8Array) {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function uuidLike() {
  // simple UUIDv4-like for audit_code (no deps)
  const b = crypto.randomBytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function onlyDigits(v: any) {
  return String(v || "").replace(/\D/g, "");
}

type SignerCapacity = "self" | "representing";

const SignerSchema = z.object({
  fullName: z.string().min(2),
  dni: z.string().min(5),
  cuil: z.string().min(5),
  address: z.string().min(5),
  phone: z.string().min(5),
});

const CanonicalBodySchema = z
  .object({
    token: z.string().min(10),
    consent: z.boolean(),
    consentTextVersion: z.string().optional().nullable(),
    signatureDataUrl: z.string().min(20),
    signer: SignerSchema,

    // P1 (opcionales para compat)
    signerCapacity: z.enum(["self", "representing"]).optional(),
    signerCompanyName: z.string().optional().nullable(),
    signerCompanyCuit: z.string().optional().nullable(),
    signerCompanyAddress: z.string().optional().nullable(),
    signerCompanyRole: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const cap = (val.signerCapacity || "self") as SignerCapacity;
    if (cap === "representing") {
      const name = String(val.signerCompanyName || "").trim();
      const cuit = onlyDigits(val.signerCompanyCuit);
      const role = String(val.signerCompanyRole || "").trim();

      if (name.length < 2) ctx.addIssue({ code: "custom", message: "Company name required when representing" });
      if (role.length < 2) ctx.addIssue({ code: "custom", message: "Company role required when representing" });
      if (cuit.length !== 11)
        ctx.addIssue({ code: "custom", message: "Company CUIT must be 11 digits when representing" });
    }
  });

const BodySchema = z.preprocess((v) => {
  if (!v || typeof v !== "object") return v;
  const b: any = v;

  // signatureDataUrl aliases
  if (!b.signatureDataUrl && b.signature_data_url) b.signatureDataUrl = b.signature_data_url;

  // signerCapacity aliases
  if (!b.signerCapacity && b.signer_capacity) b.signerCapacity = b.signer_capacity;

  // company aliases
  if (!b.signerCompanyName && b.signer_company_name) b.signerCompanyName = b.signer_company_name;
  if (!b.signerCompanyCuit && b.signer_company_cuit) b.signerCompanyCuit = b.signer_company_cuit;
  if (!b.signerCompanyAddress && b.signer_company_address) b.signerCompanyAddress = b.signer_company_address;
  if (!b.signerCompanyRole && b.signer_company_role) b.signerCompanyRole = b.signer_company_role;

  // signer object: allow snake_case inside signer
  if (b.signer && typeof b.signer === "object") {
    const s = b.signer;
    if (!s.fullName && s.full_name) s.fullName = s.full_name;
    if (!s.dni && s.signer_dni) s.dni = s.signer_dni;
    if (!s.cuil && s.signer_cuil) s.cuil = s.signer_cuil;
    if (!s.address && s.signer_address) s.address = s.signer_address;
    if (!s.phone && s.signer_phone) s.phone = s.signer_phone;
  }

  // legacy: signer fields sueltos
  if (!b.signer) {
    const fullName = b.signer_full_name || b.full_name || b.fullName;
    const dni = b.signer_dni || b.dni;
    const cuil = b.signer_cuil || b.cuil;
    const address = b.signer_address || b.address;
    const phone = b.signer_phone || b.phone;

    if (fullName && dni && cuil && address && phone) {
      b.signer = {
        fullName,
        dni,
        cuil,
        address,
        phone,
      };
    }
  }

  return b;
}, CanonicalBodySchema);

// Helpers para compatibilidad de DB (si aún no migraste columnas nuevas)
function isMissingColumnError(err: any) {
  const msg = String(err?.message || err || "");
  // PostgREST suele devolver mensajes de columna inexistente
  return (
    msg.toLowerCase().includes("column") &&
    (msg.toLowerCase().includes("does not exist") || msg.toLowerCase().includes("not found"))
  );
}

export async function POST(req: NextRequest) {
  try {
    let parsed: z.infer<typeof CanonicalBodySchema>;
    try {
      parsed = BodySchema.parse(await req.json());
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid body",
            details: process.env.NODE_ENV === "production" ? undefined : e.issues,
          },
          { status: 400 }
        );
      }
      throw e;
    }

    const body = parsed;

    if (!body.consent) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1) Fetch signing request by token
    const srRes = await admin
      .from("signing_requests")
      .select("*")
      .eq("token", body.token)
      .maybeSingle();

    if (srRes.error || !srRes.data) {
      return NextResponse.json(
        { error: "Este enlace puede haber vencido o haber sido reemplazado por un reenvío." },
        { status: 400 }
      );
    }

    const sr = srRes.data as any;

    if (sr.status !== "pending") {
      return NextResponse.json(
        { error: "Este enlace puede haber vencido o haber sido reemplazado por un reenvío." },
        { status: 400 }
      );
    }

    const documentId = String(sr.document_id);

    // 2) Fetch document
    const docRes = await admin.from("documents").select("*").eq("id", documentId).maybeSingle();
    if (docRes.error || !docRes.data) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }
    const doc = docRes.data as any;

    // 3) Persist signature metadata (compat: columnas nuevas pueden no existir)
    const signerFullName = body.signer.fullName;
    const signerDni = body.signer.dni;
    const signerCuil = body.signer.cuil;
    const signerAddress = body.signer.address;
    const signerPhone = body.signer.phone;

    const signerCapacity: SignerCapacity = (body.signerCapacity || "self") as SignerCapacity;

    const companyName =
      signerCapacity === "representing" ? String(body.signerCompanyName || "").trim() : null;
    const companyCuit =
      signerCapacity === "representing" ? onlyDigits(body.signerCompanyCuit) : null;
    const companyAddress =
      signerCapacity === "representing" ? String(body.signerCompanyAddress || "").trim() : null;
    const companyRole =
      signerCapacity === "representing" ? String(body.signerCompanyRole || "").trim() : null;

    const signaturePngBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signatureHashSha256 = sha256Hex(signaturePngBytes);

    const nowIso = new Date().toISOString();

    // Intentamos update con columnas nuevas primero; si no existen, fallback.
    let updateRes = await admin
      .from("signing_requests")
      .update({
        status: "signed",
        signed_at: nowIso,
        signer_full_name: signerFullName,
        signer_dni: signerDni,
        signer_cuil: signerCuil,
        signer_address: signerAddress,
        signer_phone: signerPhone,
        signature_data_url: body.signatureDataUrl,
        signature_hash_sha256: signatureHashSha256,
        signer_ip: getIp(req),
        signer_user_agent: req.headers.get("user-agent") ?? null,
        signer_capacity: signerCapacity,
        signer_company_name: companyName,
        signer_company_cuit: companyCuit,
        signer_company_address: companyAddress,
        signer_company_role: companyRole,
        consent_text_version: body.consentTextVersion ?? null,
      })
      .eq("id", sr.id);

    if (updateRes.error && isMissingColumnError(updateRes.error)) {
      // Fallback legacy: sin columnas nuevas
      updateRes = await admin
        .from("signing_requests")
        .update({
          status: "signed",
          signed_at: nowIso,
          signer_full_name: signerFullName,
          signer_dni: signerDni,
          signer_cuil: signerCuil,
          signer_address: signerAddress,
          signer_phone: signerPhone,
          signature_data_url: body.signatureDataUrl,
          signature_hash_sha256: signatureHashSha256,
          signer_ip: getIp(req),
          signer_user_agent: req.headers.get("user-agent") ?? null,
          consent_text_version: body.consentTextVersion ?? null,
        })
        .eq("id", sr.id);
    }

    if (updateRes.error) {
      console.error("signing_requests update error:", updateRes.error);
      return NextResponse.json({ error: "No se pudo registrar la firma" }, { status: 500 });
    }

    // Audit event: signed
    try {
      await admin.from("audit_events").insert({
        document_id: documentId,
        signing_request_id: sr.id,
        actor_email: sr.email ? String(sr.email) : null,
        event_type: "signed",
        ip: getIp(req),
        user_agent: req.headers.get("user-agent") ?? null,
        payload: {
          signer_full_name: signerFullName,
          signer_dni: signerDni,
          signer_cuil: signerCuil,
          signer_address: signerAddress,
          signer_phone: signerPhone,
          signer_capacity: signerCapacity,
          signer_company_name: companyName,
          signer_company_cuit: companyCuit,
          signer_company_role: companyRole,
          signer_company_address: companyAddress,
          signature_hash_sha256: signatureHashSha256,
          consent_text_version: body.consentTextVersion ?? null,
        },
      });
    } catch {}

    // 4) Check if all signing requests are signed => finalize
    const allRes = await admin
      .from("signing_requests")
      .select("id,status,email,token,signed_at,signer_full_name,signer_dni,signer_cuil,signer_address,signer_phone,signature_data_url,signature_hash_sha256,signer_ip,signer_user_agent,signer_capacity,signer_company_name,signer_company_cuit,signer_company_address,signer_company_role")
      .eq("document_id", documentId);

    if (allRes.error || !Array.isArray(allRes.data)) {
      return NextResponse.json({ ok: true, status: "signed" });
    }

    const signers = allRes.data as any[];
    const allSigned = signers.every((x) => x.status === "signed");
    const shouldFinalize = allSigned && !doc.final_path;

    if (!shouldFinalize) {
      return NextResponse.json({ ok: true, status: "signed" });
    }

    // 5) Finalize PDF: load original from storage
    const originalPath = String(doc.original_path || "");
    if (!originalPath) {
      return NextResponse.json({ ok: true, status: "signed" });
    }

    const dl = await admin.storage.from("fds").download(originalPath);
    if (dl.error || !dl.data) {
      console.error("storage download original failed:", dl.error);
      return NextResponse.json({ error: "No se pudo descargar el PDF original" }, { status: 500 });
    }

    const originalBytes = new Uint8Array(await dl.data.arrayBuffer());
    const pdfDoc = await PDFDocument.load(originalBytes);

    // 6) Append signature pages + certificate page
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Prepare QR for verification
    const auditCode = uuidLike();
    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app"}/v/${auditCode}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 });
    const qrPngBytes = dataUrlToPngBytes(qrDataUrl);
    const qrImage = await pdfDoc.embedPng(qrPngBytes);

    // Certificate page (simple)
    const certPage = pdfDoc.addPage([595.28, 841.89]); // A4 portrait in points
    certPage.drawText("Certificado de Firma Electrónica (simple)", {
      x: 56,
      y: 800,
      size: 16,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });
    certPage.drawText("Ley 25.506 (República Argentina) - Art. 5", {
      x: 56,
      y: 780,
      size: 10,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    certPage.drawText(`Código de auditoría: ${auditCode}`, {
      x: 56,
      y: 750,
      size: 11,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });

    certPage.drawText("Verificación pública:", {
      x: 56,
      y: 730,
      size: 10,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });

    certPage.drawText(verifyUrl, {
      x: 56,
      y: 715,
      size: 9,
      font,
      color: rgb(0.12, 0.27, 0.58),
    });

    // QR
    certPage.drawImage(qrImage, {
      x: 400,
      y: 690,
      width: 140,
      height: 140,
    });

    // Table header
    certPage.drawRectangle({
      x: 56,
      y: 650,
      width: 483,
      height: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    certPage.drawText("Firmantes", { x: 56, y: 630, size: 12, font, color: rgb(0.05, 0.05, 0.05) });

    let y = 610;
    for (const s of signers) {
      const email = String(s.email || "");
      const nm = String(s.signer_full_name || "");
      const dni = String(s.signer_dni || "");
      const cuil = String(s.signer_cuil || "");
      const cap = String(s.signer_capacity || "self");
      const company =
        cap === "representing"
          ? ` | Representa: ${String(s.signer_company_name || "")} (CUIT ${String(s.signer_company_cuit || "")}) - ${String(
              s.signer_company_role || ""
            )}`
          : "";

      const line = `• ${nm} | DNI ${dni} | CUIL ${cuil}${email ? ` | ${email}` : ""}${company}`;
      certPage.drawText(line.slice(0, 110), { x: 56, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
      if (y < 80) break;
    }

    certPage.drawText("Nota:", {
      x: 56,
      y: 72,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
    certPage.drawText(
      "FES implementa firma electrónica simple. No constituye firma digital certificada ni certifica identidad por sí misma.",
      { x: 56, y: 58, size: 8.5, font, color: rgb(0.35, 0.35, 0.35) }
    );

    // Add signature pages (one per signer)
    for (const s of signers) {
      const nm = String(s.signer_full_name || "Firmante");
      const sigDataUrl = String(s.signature_data_url || "");
      if (!sigDataUrl) continue;

      const sigPng = dataUrlToPngBytes(sigDataUrl);
      const sigImage = await pdfDoc.embedPng(sigPng);

      const page = pdfDoc.addPage([595.28, 841.89]);

      page.drawText("Firma registrada", {
        x: 56,
        y: 800,
        size: 16,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });

      page.drawText(`Firmante: ${nm}`, {
        x: 56,
        y: 775,
        size: 11,
        font,
        color: rgb(0.05, 0.05, 0.05),
      });

      page.drawText(`Fecha: ${String(s.signed_at || "")}`, {
        x: 56,
        y: 758,
        size: 10,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      // Signature box
      page.drawRectangle({
        x: 56,
        y: 600,
        width: 483,
        height: 140,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98),
      });

      page.drawImage(sigImage, { x: 80, y: 630, width: 320, height: 80 });

      page.drawText(`Hash firma (SHA-256): ${String(s.signature_hash_sha256 || "")}`, {
        x: 56,
        y: 580,
        size: 9,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });

      // QR mini
      page.drawImage(qrImage, {
        x: 420,
        y: 610,
        width: 90,
        height: 90,
      });
    }

    // Save final
    const pdfBytes = await pdfDoc.save();
    const finalHashSha256 = sha256Hex(pdfBytes);

    // Upload final to storage
    const finalPath = `documents/${documentId}/final_${Date.now()}.pdf`;
    const up = await admin.storage.from("fds").upload(finalPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (up.error) {
      console.error("storage upload final failed:", up.error);
      return NextResponse.json({ error: "No se pudo subir el PDF final" }, { status: 500 });
    }

    // Update document with audit_code + final_path + completed_at
    const updDoc = await admin
      .from("documents")
      .update({
        audit_code: auditCode,
        final_path: finalPath,
        completed_at: nowIso,
        final_hash_sha256: finalHashSha256,
      })
      .eq("id", documentId);

    if (updDoc.error) {
      console.error("documents update final failed:", updDoc.error);
      return NextResponse.json({ error: "No se pudo finalizar el documento" }, { status: 500 });
    }

    // Audit event: document_completed
    try {
      await admin.from("audit_events").insert({
        document_id: documentId,
        signing_request_id: sr.id,
        actor_email: sr.email ? String(sr.email) : null,
        event_type: "document_completed",
        ip: getIp(req),
        user_agent: req.headers.get("user-agent") ?? null,
        payload: {
          audit_code: auditCode,
          final_path: finalPath,
          final_hash_sha256: finalHashSha256,
          signers: signers.map((x) => ({
            email: x.email || null,
            signer_full_name: x.signer_full_name || null,
            signer_dni: x.signer_dni || null,
            signer_capacity: x.signer_capacity || null,
            signer_company_name: x.signer_company_name || null,
            signer_company_cuit: x.signer_company_cuit || null,
            signer_company_role: x.signer_company_role || null,
            signer_company_address: x.signer_company_address || null,
            signed_at: x.signed_at || null,
            signer_ip: x.signer_ip || null,
            signer_user_agent: x.signer_user_agent || null,
          })),
        },
      });
    } catch {}

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

      // firmantes (emails + token)
      const signersRes = await admin
        .from("signing_requests")
        .select("email, token, status")
        .eq("document_id", documentId);

      const signersRows: Array<{ email?: string | null; token?: string | null; status?: string | null }> =
        Array.isArray((signersRes as any)?.data) ? ((signersRes as any).data as any[]) : [];

      const rawRecipients = [
        createdByEmail,
        ...signersRows.map((r) => String(r?.email || "")),
      ]
        .map((x) => String(x || "").trim())
        .filter(Boolean);

      const recipients = Array.from(new Set(rawRecipients.filter((e) => isValidEmail(e))));

      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app").replace(/\/+$/, "");
      const verifyUrl2 = `${siteUrl}/v/${encodeURIComponent(auditCodeForEmail)}`;
      const subject = `✅ Documento finalizado: ${titleForEmail}`;

      // Enviamos 1 email por destinatario para:
      // - no exponer emails entre sí
      // - permitir link de descarga con token para firmantes
      const sendResults: Array<{ to: string; resend_id: string | null; error?: string }> = [];

      if (recipients.length > 0) {
        const ownerEmail = isValidEmail(createdByEmail) ? String(createdByEmail).trim() : "";
        const ownerEmailLc = ownerEmail ? ownerEmail.toLowerCase() : "";

        for (const to of recipients) {
          const toLc = to.toLowerCase();

          const row = signersRows.find((r) => String(r?.email || "").trim().toLowerCase() === toLc);
          const signerToken =
            row && String(row?.status || "").toLowerCase() === "signed" && row?.token ? String(row.token) : null;

          // ✅ Descarga:
          // - Firmantes: link con token (no requiere login)
          // - Owner: link sin token (requiere sesión)
          const downloadUrl = signerToken
            ? `${siteUrl}/api/download?documentId=${encodeURIComponent(documentId)}&kind=final&token=${encodeURIComponent(
                signerToken
              )}`
            : ownerEmailLc && toLc === ownerEmailLc
              ? `${siteUrl}/api/download?documentId=${encodeURIComponent(documentId)}&kind=final`
              : null;

          const introLine = downloadUrl
            ? `“${escapeHtml(titleForEmail)}” fue firmado por todos. Podés descargar el PDF final y conservar el código de auditoría para referencia.`
            : `“${escapeHtml(titleForEmail)}” fue firmado por todos. Conservá el código de auditoría para referencia.`;

          const bodyHtml = `
            <p style="margin:0 0 12px 0; font-size:14px; line-height:1.6;">
              ${introLine}
            </p>

            ${
              downloadUrl
                ? `<p style="margin:0 0 16px 0;">
                    <a
                      href="${escapeHtml(downloadUrl)}"
                      style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;"
                    >
                      Descargar PDF final
                    </a>
                  </p>`
                : `<p style="margin:0 0 16px 0; font-size:13px; line-height:1.6; color:#3f3f46;">
                    Para descargar el PDF final, ingresá con tu cuenta o pedile al creador del documento que te comparta un acceso.
                  </p>`
            }

            <p style="margin:0 0 10px 0;"><b>Fecha:</b> ${escapeHtml(completedAtForEmail)}</p>

            <p style="margin:0 0 10px 0;">
              <b>Código de auditoría:</b>
              <span style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">
                ${escapeHtml(auditCodeForEmail)}
              </span>
            </p>

            <p style="margin:0 0 10px 0;">
              <b>Verificación pública:</b>
              <a href="${escapeHtml(verifyUrl2)}" style="color:#2563eb; text-decoration:underline;">
                ${escapeHtml(verifyUrl2)}
              </a>
            </p>

            <p style="margin:0; color:#71717a; font-size:12px; line-height:1.6;">
              FES implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma digital certificada.
            </p>
          `.trim();

          const html = baseEmailTemplate({
            title: "Documento finalizado",
            preheader: `Documento finalizado: ${titleForEmail}`,
            bodyHtml,
          });

          const text =
            `Documento finalizado: ${titleForEmail}` +
            `\nFecha: ${completedAtForEmail}` +
            `\nCódigo de auditoría: ${auditCodeForEmail}` +
            `\nVerificación: ${verifyUrl2}` +
            (downloadUrl ? `\nDescarga: ${downloadUrl}` : "");

          try {
            const sent = await sendResendEmail({
              to: [to],
              subject,
              html,
              text,
            });

            sendResults.push({ to, resend_id: (sent as any)?.id || null });
          } catch (e: any) {
            console.error("completion email send failed:", to, e);
            sendResults.push({ to, resend_id: null, error: String(e?.message || e).slice(0, 500) });
          }
        }

        const ok = sendResults.filter((r) => !r.error);
        const fail = sendResults.filter((r) => r.error);

        // Auditoría: registrar envíos OK
        if (ok.length > 0) {
          try {
            await admin.from("audit_events").insert({
              document_id: documentId,
              event_type: "completion_email_sent",
              actor_email: isValidEmail(ownerEmail) ? ownerEmail : null,
              payload: { to: ok.map((r) => r.to), subject, resend_ids: ok.map((r) => r.resend_id) },
            });
          } catch {}
        }

        // Auditoría: registrar fallos parciales (no rompe la firma)
        if (fail.length > 0) {
          try {
            await admin.from("audit_events").insert({
              document_id: documentId,
              event_type: "completion_email_failed",
              actor_email: isValidEmail(ownerEmail) ? ownerEmail : null,
              payload: { error: "Some recipients failed", failures: fail },
            });
          } catch {}
        }
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

    return NextResponse.json({ ok: true, status: shouldFinalize ? "finalized" : "signed" });
  } catch (e: any) {
    const status = Number(e?.status || 500);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status });
  }
}
