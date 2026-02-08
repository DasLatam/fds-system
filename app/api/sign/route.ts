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

    // Normalización de identidad (aceptar guiones/espacios)
    const signer = {
      fullName: String(body.signer.fullName || "").trim(),
      dni: onlyDigits(body.signer.dni),
      cuil: onlyDigits(body.signer.cuil),
      address: String(body.signer.address || "").trim(),
      phone: onlyDigits(body.signer.phone),
    };

    if (!signer.fullName || signer.fullName.length < 2) {
      return NextResponse.json({ error: "Invalid signer_full_name" }, { status: 400 });
    }
    if (signer.cuil.length !== 11) {
      return NextResponse.json({ error: "CUIL inválido: debe tener 11 dígitos" }, { status: 400 });
    }

    const signerCapacity = (body.signerCapacity || "self") as SignerCapacity;
    const company = {
      name: String(body.signerCompanyName || "").trim() || null,
      cuit: onlyDigits(body.signerCompanyCuit || null) || null,
      address: String(body.signerCompanyAddress || "").trim() || null,
      role: String(body.signerCompanyRole || "").trim() || null,
    };

    if (signerCapacity === "representing") {
      if (!company.name || company.name.length < 2) {
        return NextResponse.json({ error: "Razón social requerida para firmar en representación" }, { status: 400 });
      }
      if (!company.role || company.role.length < 2) {
        return NextResponse.json({ error: "Rol/cargo requerido para firmar en representación" }, { status: 400 });
      }
      if (!company.cuit || company.cuit.length !== 11) {
        return NextResponse.json({ error: "CUIT inválido: debe tener 11 dígitos" }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1) Buscar signing_request por token
    const srRes = await admin.from("signing_requests").select("*").eq("token", body.token).maybeSingle();

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

    // 4) Update signer status (con fallback si DB todavía no tiene columnas P1)
    const baseUpdate: any = {
      status: "signed",
      signed_at: nowIso,
      signature_path: signaturePath,
      signer_full_name: signer.fullName,
      signer_dni: signer.dni,
      signer_cuil: signer.cuil,
      signer_address: signer.address,
      signer_phone: signer.phone,
      signer_ip: getIp(req),
      signer_user_agent: req.headers.get("user-agent") ?? null,
      consented_at: nowIso,
      consent_text_version: body.consentTextVersion ?? null,
      signature_hash: sha256Hex(signatureBytes),
    };

    const p1Update: any = {
      signer_capacity: signerCapacity,
      signer_company_name: signerCapacity === "representing" ? company.name : null,
      signer_company_cuit: signerCapacity === "representing" ? company.cuit : null,
      signer_company_address: signerCapacity === "representing" ? company.address : null,
      signer_company_role: signerCapacity === "representing" ? company.role : null,
    };

    let updSigner = await admin.from("signing_requests").update({ ...baseUpdate, ...p1Update }).eq("id", sr.id);

    if (updSigner.error && isMissingColumnError(updSigner.error)) {
      // fallback: DB aún no migrada
      updSigner = await admin.from("signing_requests").update(baseUpdate).eq("id", sr.id);
    }

    if (updSigner.error) {
      return NextResponse.json({ error: "Failed to update signer" }, { status: 500 });
    }

    // 5) Update signed_count en documents
    const inc = (doc.signed_count ?? 0) + 1;

    const updCounts = await admin.from("documents").update({ signed_count: inc }).eq("id", documentId);

    if (updCounts.error) {
      return NextResponse.json({ error: "Failed to update document counts" }, { status: 500 });
    }

    // 6) Ver si hay que finalizar (si ya firmaron todos)
    const total = Number(doc.total_signers ?? 0);
    const shouldFinalize = total > 0 && inc >= total;

    if (shouldFinalize) {
      // Re-cargar documento actualizado + firmantes para generar PDF final
      const doc2Res = await admin
        .from("documents")
        .select("id,title,created_by,signing_mode,original_path,total_signers,signed_count,status")
        .eq("id", documentId)
        .maybeSingle();

      if (doc2Res.error || !doc2Res.data) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      const doc2 = doc2Res.data as any;

      // Descargar original.pdf
      const dl = await admin.storage.from("fds").download(doc2.original_path);
      if (dl.error || !dl.data) {
        return NextResponse.json({ error: "Failed to download original PDF" }, { status: 500 });
      }
      const originalBytes = new Uint8Array(await dl.data.arrayBuffer());

      // Generar audit_code
      const auditCode = uuidLike();

      // Armado PDF final: marca en todas las páginas + constancia + QR
      const originalPdf = await PDFDocument.load(originalBytes, { ignoreEncryption: true });

      const font = await originalPdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await originalPdf.embedFont(StandardFonts.HelveticaBold);

      const pages = originalPdf.getPages();

      // QR apuntando a /v/<audit_code>
      const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app"}/v/${auditCode}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
      const qrBytes = dataUrlToPngBytes(qrDataUrl);

      const qrImage = await originalPdf.embedPng(qrBytes);

      // Marca electrónica en todas las páginas
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        const { width, height } = p.getSize();

        const boxW = 180;
        const boxH = 48;
        const x = width - boxW - 18;
        const y = 18;

        p.drawRectangle({
          x,
          y,
          width: boxW,
          height: boxH,
          borderColor: rgb(0.1, 0.1, 0.1),
          borderWidth: 1,
          color: rgb(1, 1, 1),
          opacity: 0.95,
        });

        p.drawText("FES • Firma Electrónica", {
          x: x + 8,
          y: y + 30,
          size: 9,
          font: fontBold,
          color: rgb(0.1, 0.1, 0.1),
        });

        p.drawText(`Código: ${auditCode.slice(0, 8)}…`, {
          x: x + 8,
          y: y + 18,
          size: 8,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });

        p.drawText(`Pág. ${i + 1}/${pages.length}`, {
          x: x + 8,
          y: y + 7,
          size: 8,
          font,
          color: rgb(0.15, 0.15, 0.15),
        });

        p.drawImage(qrImage, { x: x + boxW - 40, y: y + 6, width: 34, height: 34, opacity: 0.95 });
      }

      // Página de constancia (multipágina si muchas firmas)
      const SIGN_W = 240;
      const SIGN_H = 80; // reducido ~50%
      const MARGIN = 40;
      const ROW_GAP = 18;

      function addCertPage() {
        const page = originalPdf.addPage([595.28, 841.89]); // A4
        return page;
      }

      let certPage = addCertPage();
      let cursorY = 841.89 - MARGIN;

      const title = "Constancia de Firma Electrónica";
      certPage.drawText(title, { x: MARGIN, y: cursorY - 22, size: 18, font: fontBold, color: rgb(0, 0, 0) });
      cursorY -= 46;

      certPage.drawText(`Documento: ${String(doc2.title || "Documento")}`, {
        x: MARGIN,
        y: cursorY,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      cursorY -= 18;

      certPage.drawText(`Código de auditoría: ${auditCode}`, {
        x: MARGIN,
        y: cursorY,
        size: 11,
        font,
        color: rgb(0, 0, 0),
      });
      cursorY -= 18;

      certPage.drawText(`URL de verificación: ${verifyUrl}`, {
        x: MARGIN,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      cursorY -= 18;

      certPage.drawText(`Fecha de finalización (UTC): ${nowIso}`, {
        x: MARGIN,
        y: cursorY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      cursorY -= 28;

      certPage.drawImage(qrImage, { x: 595.28 - MARGIN - 90, y: 841.89 - MARGIN - 90, width: 90, height: 90 });

      /**
       * ✅ FIX TypeScript:
       * el tipo de la respuesta cambia entre el select "con P1" y el select "sin P1".
       * Tipamos `signersRes` con un shape mínimo para permitir el fallback sin error de compilación.
       */
      let signersRes: { data: any[] | null; error: any } = await admin
        .from("signing_requests")
        .select(
          "id,email,status,position,signed_at,signature_path,signature_hash,signer_full_name,signer_dni,signer_ip,signer_user_agent,consented_at,consent_text_version,signer_capacity,signer_company_name,signer_company_cuit,signer_company_address,signer_company_role"
        )
        .eq("document_id", documentId)
        .order("position", { ascending: true, nullsFirst: true });

      if (signersRes.error && isMissingColumnError(signersRes.error)) {
        signersRes = await admin
          .from("signing_requests")
          .select(
            "id,email,status,position,signed_at,signature_path,signature_hash,signer_full_name,signer_dni,signer_ip,signer_user_agent,consented_at,consent_text_version"
          )
          .eq("document_id", documentId)
          .order("position", { ascending: true, nullsFirst: true });
      }

      if (signersRes.error) {
        return NextResponse.json({ error: "Failed to load signers" }, { status: 500 });
      }

      const signers = (signersRes.data || []) as any[];

      for (const s of signers) {
        if (cursorY < MARGIN + SIGN_H + 90) {
          certPage = addCertPage();
          cursorY = 841.89 - MARGIN;
          certPage.drawText(title, { x: MARGIN, y: cursorY - 22, size: 18, font: fontBold, color: rgb(0, 0, 0) });
          cursorY -= 46;
        }

        // Descargar firma y embeberla
        let sigImg: any = null;
        if (s.signature_path) {
          const sigDl = await admin.storage.from("fds").download(String(s.signature_path));
          if (!sigDl.error && sigDl.data) {
            const sigBytes = new Uint8Array(await sigDl.data.arrayBuffer());
            sigImg = await originalPdf.embedPng(sigBytes);
          }
        }

        const label = `${String(s.signer_full_name || s.email || "Firmante")} • DNI ${String(s.signer_dni || "-")}`;
        certPage.drawText(label, { x: MARGIN, y: cursorY, size: 11, font: fontBold, color: rgb(0, 0, 0) });
        cursorY -= 14;

        // P1: línea de representación si existe
        const cap: SignerCapacity = (s.signer_capacity as any) || "self";
        if (cap === "representing") {
          const cname = String(s.signer_company_name || "-");
          const ccuit = onlyDigits(s.signer_company_cuit || "");
          const crole = String(s.signer_company_role || "");
          const repLine = `En representación de: ${cname}${ccuit ? ` (CUIT ${ccuit})` : ""}${
            crole ? ` • Rol: ${crole}` : ""
          }`;
          certPage.drawText(repLine, { x: MARGIN, y: cursorY, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
          cursorY -= 12;

          if (s.signer_company_address) {
            certPage.drawText(`Domicilio empresa: ${String(s.signer_company_address)}`, {
              x: MARGIN,
              y: cursorY,
              size: 8,
              font,
              color: rgb(0.25, 0.25, 0.25),
            });
            cursorY -= 11;
          }
        }

        if (sigImg) {
          certPage.drawRectangle({
            x: MARGIN,
            y: cursorY - SIGN_H,
            width: SIGN_W,
            height: SIGN_H,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 1,
          });
          certPage.drawImage(sigImg, {
            x: MARGIN + 6,
            y: cursorY - SIGN_H + 6,
            width: SIGN_W - 12,
            height: SIGN_H - 12,
          });
        } else {
          certPage.drawRectangle({
            x: MARGIN,
            y: cursorY - SIGN_H,
            width: SIGN_W,
            height: SIGN_H,
            borderColor: rgb(0.2, 0.2, 0.2),
            borderWidth: 1,
          });
          certPage.drawText("(sin imagen de firma)", {
            x: MARGIN + 8,
            y: cursorY - 24,
            size: 9,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }

        cursorY -= SIGN_H + ROW_GAP;

        // Datos de evidencia extra
        const meta = `IP: ${String(s.signer_ip || "-")} • UA: ${String(s.signer_user_agent || "-")}`;
        certPage.drawText(meta, { x: MARGIN, y: cursorY + 6, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
        cursorY -= 10;
      }

      const finalBytes = await originalPdf.save();
      const finalHashSha256 = sha256Hex(finalBytes);

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

      // Auditoría: documento finalizado (firmado por todos) + snapshot de firmantes (incluye P1 si está)
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

        // firmantes (emails)
        const signersEmailsRes = await admin.from("signing_requests").select("email").eq("document_id", documentId);

        const rawRecipients = [
          createdByEmail,
          ...(Array.isArray(signersEmailsRes.data) ? signersEmailsRes.data.map((r: any) => String(r.email || "")) : []),
        ]
          .map((x) => String(x || "").trim())
          .filter(Boolean);

        const recipients = Array.from(new Set(rawRecipients.filter((e) => isValidEmail(e))));
        const subject = `✅ Documento finalizado: ${titleForEmail}`;

        const verifyUrl2 = `${process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app"}/v/${auditCodeForEmail}`;
        const downloadUrl =
          finalPathForEmail && (process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app")
            ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://firmasimple.vercel.app"}/api/download?documentId=${documentId}&kind=final`
            : null;

        if (recipients.length > 0) {
          const html = baseEmailTemplate({
            title: "Documento finalizado",
            preheader: `Documento finalizado: ${titleForEmail}`,
            intro: `“${titleForEmail}” fue firmado por todos. Podés descargar el PDF final y conservar el código de auditoría para referencia.`,
            cta: downloadUrl ? { label: "Descargar PDF final", href: downloadUrl } : undefined,
            childrenHtml: `
              <p style="margin:0 0 10px 0;"><b>Fecha:</b> ${escapeHtml(completedAtForEmail)}</p>
              <p style="margin:0 0 10px 0;"><b>Código de auditoría:</b> ${escapeHtml(auditCodeForEmail)}</p>
              <p style="margin:0 0 10px 0;">
                <b>Verificación pública:</b>
                <a href="${escapeHtml(verifyUrl2)}" style="color:#18181b; text-decoration:underline;">${escapeHtml(verifyUrl2)}</a>
              </p>
              <p style="margin:0; color:#71717a; font-size: 12px;">
                FES implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma digital certificada.
              </p>
            `.trim(),
          });

          const sent = await sendResendEmail({
            to: recipients,
            subject,
            html,
            text: `Documento finalizado: ${titleForEmail}\nFecha: ${completedAtForEmail}\nCódigo de auditoría: ${auditCodeForEmail}\nVerificación: ${verifyUrl2}${downloadUrl ? `\nDescarga: ${downloadUrl}` : ""}`,
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