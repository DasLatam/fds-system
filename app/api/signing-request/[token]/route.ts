import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  const { data: reqRow, error: reqErr } = await supabaseAdmin
    .from("signing_requests")
    .select("id,email,status,document_id")
    .eq("token", token)
    .single();

  if (reqErr || !reqRow) {
    return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  }

  const { data: docRow, error: docErr } = await supabaseAdmin
    .from("documents")
    .select("title,original_path,status")
    .eq("id", reqRow.document_id)
    .single();

  if (docErr || !docRow) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const { data: signed, error: signedErr } = await supabaseAdmin.storage
    .from("fds")
    .createSignedUrl(docRow.original_path, 600);

  if (signedErr || !signed?.signedUrl) {
    return NextResponse.json({ error: "No se pudo generar URL" }, { status: 500 });
  }

  return NextResponse.json({
    title: docRow.title,
    email: reqRow.email,
    status: reqRow.status,
    documentId: reqRow.document_id,
    pdfUrl: signed.signedUrl,
  });
}