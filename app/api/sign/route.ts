import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256HexFromString } from "@/lib/utils/crypto";
import { buildFinalPdf, type EvidenceSigner } from "@/lib/pdf/finalizePdf";
import { logEvent } from "@/lib/audit/logEvent";
import { sendFinalEmail } from "@/lib/mail/send";

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

    // Load signing request
    const { data: sr, error: srErr } = await admin
      .from("signing_requests")
      .select(
        "id, document_id, email, status, position, signer_full_name, signer_dni, signer_cuil, signer_address, signer_phone"
      )
      .eq("token", body.token)
      .maybeSingle();

    if (srErr || !sr) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }
    if (sr.status === "signed") {
      return NextResponse.json({ error: "Already signed" }, { status: 400 });
    }

    const { data: doc, error: docErr } = await admin
      .from("documents")
      .select("id, title, created_by, signing_mode, original_path, original_hash, total_signers, signed_count")
      .eq("id", sr.document_id)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Sequential enforcement
    if (doc.signing_mode === "sequential" && sr.position != null) {
      const { data: prev } = await admin
        .from("signing_requests")
        .select("id")
        .eq("document_id", doc.id)
        .lt("position", sr.position)
        .neq("status", "signed")
        .limit(1);
      if (prev && prev.length > 0) {
        return NextResponse.json({ error: "Not your turn yet" }, { status: 409 });
      }
    }

    // Store signature image in Storage
    const signatureBytes = dataUrlToPngBytes(body.signatureDataUrl);
    const signatureHash = sha256HexFromString(body.signatureDataUrl);
    const signaturePath = `${doc.created_by}/${doc.id}/signatures/${sr.id}.png`;

    const upRes = await admin.storage.from("fds").upload(signaturePath, signatureBytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upRes.error) {
      return NextResponse.json({ error: `Signature upload failed: ${upRes.error.message}` }, { status: 500 });
    }

    // Update signer info + status
    const nowIso = new Date().toISOString();
    const { error: updErr } = await admin
      .from("signing_requests")
      .update({
        status: "signed",
        signed_at: nowIso,
        signer_ip: ip,
        signature_hash: signatureHash,
        signature_path: signaturePath,
        signer_full_name: body.signer.fullName,
        signer_dni: body.signer.dni,
        signer_cuil: body.signer.cuil,
        signer_address: body.signer.address,
        signer_phone: body.signer.phone,
      })
      .eq("id", sr.id);

    if (updErr) {
      return NextResponse.json({ error: `Failed to update signing request: ${updErr.message}` }, { status: 500 });
    }

    await logEvent({
      documentId: doc.id,
      signingRequestId: sr.id,
      actorEmail: sr.email,
      eventType: "signature_submitted",
      ip,
      userAgent,
    });

    let rpcWorked = false;

try {
  const { error: rpcErr } = await admin.rpc("increment_signed_count", {
    p_document_id: doc.id,
  });

  if (!rpcErr) rpcWorked = true;
} catch {
  rpcWorked = false;
}

// Si no existe el RPC o falló, hacé el update manual (tu fallback)
if (!rpcWorked) {
  // ✅ tu lógica manual existente debajo (no la cambies)
}


    // Manual recount (robust)
    const { count: signedCount } = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("status", "signed");

    const signed = signedCount || 0;

    await admin
      .from("documents")
      .update({ signed_count: signed })
      .eq("id", doc.id);

    // If all signed -> build final PDF
    const { count: totalCount } = await admin
      .from("signing_requests")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);

    const total = totalCount || 0;

    await admin
      .from("documents")
      .update({ total_signers: total })
      .eq("id", doc.id);

    if (total > 0 && signed >= total) {
      // Download original PDF
      const dl = await admin.storage.from("fds").download(doc.original_path);
      if (dl.error) {
        return NextResponse.json({ error: `Failed to download original: ${dl.error.message}` }, { status: 500 });
      }
      const originalBytes = new Uint8Array(await dl.data.arrayBuffer());

      // Load all signers + signature images
      const { data: reqs, error: reqsErr } = await admin
        .from("signing_requests")
        .select(
          "email, token, signer_full_name, signer_dni, signer_cuil, signer_address, signer_phone, signed_at, signer_ip, signature_path"
        )
        .eq("document_id", doc.id)
        .eq("status", "signed")
        .order("position", { ascending: true });

      if (reqsErr || !reqs) {
        return NextResponse.json({ error: "Failed to load signers" }, { status: 500 });
      }

      const signers: EvidenceSigner[] = [];
      for (const r of reqs) {
        const sp = r.signature_path as string;
        const sigDl = await admin.storage.from("fds").download(sp);
        if (sigDl.error) {
          return NextResponse.json({ error: `Failed to load signature image` }, { status: 500 });
        }
        const sigBytes = new Uint8Array(await sigDl.data.arrayBuffer());
        signers.push({
          email: r.email,
          fullName: r.signer_full_name || "",
          dni: r.signer_dni || "",
          cuil: r.signer_cuil || "",
          address: r.signer_address || "",
          phone: r.signer_phone || "",
          signedAt: r.signed_at || "",
          ip: r.signer_ip || "",
          signaturePngBytes: sigBytes,
        });
      }

      const completedAtIso = new Date().toISOString();
      const finalBytes = await buildFinalPdf({
        originalPdfBytes: originalBytes,
        originalHashSha256: doc.original_hash || "",
        documentTitle: doc.title,
        completedAtIso,
        signers,
      });

      const finalPath = `${doc.created_by}/${doc.id}/final/final.pdf`;
      const upFinal = await admin.storage.from("fds").upload(finalPath, finalBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upFinal.error) {
        return NextResponse.json({ error: `Final upload failed: ${upFinal.error.message}` }, { status: 500 });
      }

      await admin
        .from("documents")
        .update({ status: "signed", final_path: finalPath, completed_at: completedAtIso })
        .eq("id", doc.id);

      await logEvent({ documentId: doc.id, eventType: "pdf_finalized", ip, userAgent });

      // Notify all parties with a short-lived download link
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      for (const r of reqs as any[]) {
        const downloadUrl = `${appUrl}/api/download?documentId=${doc.id}&kind=final&token=${r.token}`;
        await sendFinalEmail({ to: r.email, documentTitle: doc.title, downloadUrl }).catch(() => {});
      }

    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
