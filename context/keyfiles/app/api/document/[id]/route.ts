import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Traemos el doc (admin para leer paths aunque haya RLS)
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, created_by, status, total_signers, signed_count, original_path, final_path")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.created_by !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Regla "eliminable" mínima y segura:
  // - no signed
  // - sin firmas
  // - sin firmantes (chequeo real en signing_requests)
  if (doc.status === "signed" || (doc.signed_count ?? 0) > 0) {
    return NextResponse.json({ error: "Cannot delete a signed document" }, { status: 409 });
  }

  const { count: srCount } = await admin
    .from("signing_requests")
    .select("id", { head: true, count: "exact" })
    .eq("document_id", doc.id);

  if ((srCount ?? 0) > 0) {
    return NextResponse.json({ error: "Cannot delete: has signing requests" }, { status: 409 });
  }

  // Borrado en orden (relaciones -> doc -> storage)
  await admin.from("audit_events").delete().eq("document_id", doc.id);
  await admin.from("documents").delete().eq("id", doc.id);

  const paths = [doc.original_path, doc.final_path].filter(Boolean) as string[];
  if (paths.length) {
    await admin.storage.from("fds").remove(paths);
  }

  return NextResponse.json({ ok: true });
}