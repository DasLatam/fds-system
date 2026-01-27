import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    if (!body.consent) {
      return NextResponse.json({ error: "Consent is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ip = getIp(req);
    const userAgent = req.headers.get("user-agent") || "";

    // 1) Buscar signing request por token
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

    const sr = srRes.data;
    if (!sr) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

    // Expiración
    if (sr.expires_at) {
      const exp = new Date(sr.expires_at as string).getTime();
      if (!Number.isNaN(exp) && exp < Date.now() && sr.status === "pending") {
        await admin.from("signing_requests").update({ status: "expired" }).eq("id", sr.id);
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
      }
    }
    if (sr.status === "expired") return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    if (sr.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 });

    // Documento
    const docRes = await admin
      .from("documents")
      .select("id, title, created_by, signing_mode, original_path")
      .eq("id", sr.document_id)
      .maybeSingle();

    if (docRes.error) {
      console.error("documents query error:", docRes.error);
      return NextResponse.json(
        { error: "Document query failed", details: docRes.error.message },
        { status: 500 }
      );
    }
    const doc = docRes.data;
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

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

    // Update signing request (si alguna columna no existe, lo vas a ver en details)
    const upd = await admin.from("signing_requests").update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signer_ip: ip,
      signer_user_agent: userAgent,
      signature_path: signaturePath,
      signer_full_name: body.signer.fullName,
      signer_dni: body.signer.dni,
      signer_cuil: body.signer.cuil,
      signer_address: body.signer.address,
      signer_phone: body.signer.phone,
    }).eq("id", sr.id);

    if (upd.error) {
      console.error("signing_requests update failed:", upd.error);
      return NextResponse.json(
        { error: "Failed to update signing request", details: upd.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
