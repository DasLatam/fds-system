import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
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
  const sigPage = pdfDoc.addPage([595.28, 841.89]); // A4
  const pageW = sigPage.getWidth();
  const pageH = sigPage.getHeight();

  sigPage.drawText("Constancia de evidencia de firma", {
    x: 36,
    y: pageH - 50,
    size: 16,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });

  sigPage.drawText(`Documento: ${title || "Documento"}`, {
    x: 36,
    y: pageH - 78,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  sigPage.drawText(`Finalizado: ${new Date(completedAt).toLocaleString()}`, {
    x: 36,
    y: pageH - 96,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  sigPage.drawText(`Código de auditoría: ${auditCode}`, {
    x: 36,
    y: pageH - 114,
    size: 11,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Dibujar firmas (una por firmante)
  let y = pageH - 160;

  for (const s of signers) {
    const dlSig = await admin.storage.from(bucket).download(s.signature_path);
    if (dlSig.error || !dlSig.data) continue;

    const sigBytes = new Uint8Array(await dlSig.data.arrayBuffer());
    const png = await pdfDoc.embedPng(sigBytes);

    // ✅ firma 50% más chica
    const sigW = 220 * 0.5;
    const sigH = (png.height / png.width) * sigW;

    sigPage.drawRectangle({
      x: 36,
      y,
      width: sigW,
      height: sigH,
      borderWidth: 1,
      borderColor: rgb(0.85, 0.85, 0.88),
    });

    sigPage.drawText(`${s.full_name || "Firmante"}`, {
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
        consent: body.consent,
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
    }

    return NextResponse.json({ ok: true, status: shouldFinalize ? "finalized" : "signed" });
  } catch (e: any) {
    const status = Number(e?.status || 500);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status });
  }
}