import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Schema = z.object({
  documentId: z.string().uuid(),
  kind: z.enum(["original", "final"]).default("final"),
  token: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Schema.safeParse({
    documentId: url.searchParams.get("documentId"),
    kind: url.searchParams.get("kind") || "final",
    token: url.searchParams.get("token") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { documentId, kind, token } = parsed.data;

  // AuthZ options:
  // 1) Logged-in creator (dashboard)
  // 2) Signer with valid signing token (email link)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, created_by, title, original_path, final_path")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let allowed = false;
  if (user && doc.created_by === user.id) {
    allowed = true;
  }
  if (!allowed && token) {
    const { data: sr } = await admin
      .from("signing_requests")
      .select("id,status,document_id")
      .eq("token", token)
      .maybeSingle();
    if (sr && sr.document_id === doc.id && sr.status === "signed" && kind === "final") {
      allowed = true;
    }
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const path = kind === "original" ? doc.original_path : doc.final_path;
  if (!path) return NextResponse.json({ error: "File not available" }, { status: 409 });

  const { data, error } = await admin.storage.from("fds").createSignedUrl(path, 60 * 10);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "signed url failed" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl, title: doc.title });
}
