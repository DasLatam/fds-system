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

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  const exp = new Date(expiresAt).getTime();
  return !Number.isNaN(exp) && exp < Date.now();
}

// Inserta auditoría en la tabla que exista (audit_events o audit_logs)
async function insertAuditEvent(admin: ReturnType<typeof createAdminClient>, payload: any) {
  const tryTables = ["audit_events", "audit_logs"]; // audit_logs NO existe en tu DB hoy, pero lo dejamos por compat.
  for (const table of tryTables) {
    const res = await admin.from(table).insert(payload);
    if (!res.error) return { ok: true, table };
    // si la tabla no existe, probamos la siguiente
    if (res.error?.message?.includes(`relation "${table}" does not exist`)) continue;
    // otro error real: cortamos
    return { ok: false, table, error: res.error };
  }
  return { ok: false, table: null, error: { message: "No audit table found (audit_events/audit_logs)" } as any };
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

    const sr = srRes.data;
    if (!sr) return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });

    if (isExpired(sr.expires_at as any) && sr.status === "pending") {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    if (sr.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 });

    // Documento (incluimos counts + final_path)
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

    // ✅ Defensa: no podemos finalizar si no existe original_path
    if (!doc.original_path) {
      return NextResponse.json(
        { error: "Document has no original_path; cannot finalize" },
        { status: 500 }
      );
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

    // === Recalcular signed_count real ===
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
    }

    // === Finalización estricta ===
    if (shouldComplete) {
      const finalPath = doc.final_path || `${doc.created_by}/${doc.id}/final/final.pdf`;

      // Si ya existe final_path, solo aseguramos estado coherente.
      if (!doc.final_path) {
        // Descargar original
        const dl = await admin.storage.from("fds").download(doc.original_path);
        if (dl.error || !dl.data) {
          console.error("finalize download original failed:", dl.error);
          return NextResponse.json(
            { error: "Failed to download original PDF for finalization", details: dl.error?.message },
            { status: 500 }
          );
        }

        const bytes = new Uint8Array(await dl.data.arrayBuffer());

        // Subir final
        const upFinal = await admin.storage.from("fds").upload(finalPath, bytes, {
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

        // Setear final_path
        const setFinal = await admin.from("documents").update({ final_path: finalPath }).eq("id", doc.id);
        if (setFinal.error) {
          console.error("final_path update failed:", setFinal.error);
          return NextResponse.json(
            { error: "Failed to set final_path", details: setFinal.error.message },
            { status: 500 }
          );
        }
      }

      // ✅ Ahora sí: marcar SIGNED + completed_at (coherente)
      const finalizeDoc = await admin
        .from("documents")
        .update({ status: "signed", completed_at: new Date().toISOString() })
        .eq("id", doc.id);

      if (finalizeDoc.error) {
        console.error("documents finalize status failed:", finalizeDoc.error);
        return NextResponse.json(
          { error: "Failed to finalize document status", details: finalizeDoc.error.message },
          { status: 500 }
        );
      }

      // Auditoría: pdf_finalized
      const auditPayload = {
        document_id: doc.id,
        event_type: "pdf_finalized",
        metadata: {
          final_path: doc.final_path || finalPath,
          signed_count: signedCount,
          total_signers: total,
          generated_at: new Date().toISOString(),
        },
      };

      const auditRes = await insertAuditEvent(admin, auditPayload);
      if (!auditRes.ok) {
        console.warn("audit insert failed:", auditRes);
        // No frenamos el flujo, pero lo dejamos logueado.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
