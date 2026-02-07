import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Public endpoint: resolves a signing link token to the signing request + document preview data.
// IMPORTANT: token in URL maps to signing_requests.token (NOT signing_requests.id).

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  if (!token || !isUuid(token)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1) Primary: token column
  let { data: sr, error: srErr } = await admin
    .from("signing_requests")
    .select(
      "id, token, document_id, email, status, position, expires_at, created_at, invited_at, email_sent_at, opened_at, viewed_at, signed_at, rejection_reason"
    )
    .eq("token", token)
    .maybeSingle();

  // 2) Backward-compat: sometimes older code used signing_requests.id in the URL.
  if (!sr && !srErr) {
    const fallback = await admin
      .from("signing_requests")
      .select(
        "id, token, document_id, email, status, position, expires_at, created_at, invited_at, email_sent_at, opened_at, viewed_at, signed_at, rejection_reason"
      )
      .eq("id", token)
      .maybeSingle();

    sr = fallback.data ?? null;
    srErr = fallback.error ?? null;
  }

  if (srErr) {
    return NextResponse.json(
      { error: "db_error", details: srErr.message },
      { status: 500 }
    );
  }

  if (!sr) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  // Resolve the document
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, title, status, original_path, created_at")
    .eq("id", sr.document_id)
    .maybeSingle();

  if (docErr) {
    return NextResponse.json(
      { error: "db_error", details: docErr.message },
      { status: 500 }
    );
  }

  if (!doc) {
    return NextResponse.json({ error: "document_not_found" }, { status: 404 });
  }

  // Optional: track view (best-effort)
  // Do NOT fail the request if this update errors.
  void admin
    .from("signing_requests")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", sr.id);

  // Prefill only if the visitor is logged in AND matches the invite email.
  let prefill: any = null;
  try {
    // In this repo, createSupabaseServerClient() is async and returns Promise<SupabaseClient>
    // (it needs access to cookies/session at request time).
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id && user.email && sr.email) {
      const sameEmail =
        user.email.trim().toLowerCase() === sr.email.trim().toLowerCase();

      if (sameEmail) {
        const { data: profile } = await admin
          .from("profiles")
          .select(
            "id, full_name, dni, cuil, address, phone, company_name, company_cuit, company_address, company_role"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          prefill = {
            fullName: (profile as any).full_name ?? null,
            dni: (profile as any).dni ?? null,
            cuil: (profile as any).cuil ?? null,
            address: (profile as any).address ?? null,
            phone: (profile as any).phone ?? null,
            companyName: (profile as any).company_name ?? null,
            companyCuit: (profile as any).company_cuit ?? null,
            companyAddress: (profile as any).company_address ?? null,
            companyRole: (profile as any).company_role ?? null,
          };
        }
      }
    }
  } catch {
    // ignore
  }

  // NOTE: signing_requests table does NOT have signing_mode or replaced_by (confirmed by your SQL).
  // Keep API stable by returning computed defaults.
  const signingMode = "parallel" as const;
  const replacedBy = null;

  return NextResponse.json({
    signingRequestId: sr.id,
    documentId: doc.id,
    title: doc.title,
    email: sr.email,
    status: sr.status,
    signingMode,
    position: sr.position,
    expiresAt: sr.expires_at,
    replacedBy,
    pdfUrl: `/api/preview?token=${encodeURIComponent(sr.token)}`,
    prefill,
  });
}
