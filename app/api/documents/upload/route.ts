import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const TitleSchema = z.string().min(3).max(120);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
      return NextResponse.json({ error: "auth_error", details: userErr.message }, { status: 401 });
    }
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const title = TitleSchema.parse(String(form.get("title") || "").trim());

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const admin = createAdminClient();

    // DEBUG: log mínimo en Vercel (no imprime secretos)
    console.log("upload: creating document for user", { userId: user.id, title });

    const docIns = await admin
      .from("documents")
      .insert({
        created_by: user.id,
        title,
        status: "draft",
        signing_mode: "parallel",
        total_signers: 0,
        signed_count: 0,
      })
      .select("id")
      .single();

    if (docIns.error || !docIns.data) {
      console.error("upload: documents insert failed", docIns.error);
      return NextResponse.json(
        { error: "Failed to create document", details: docIns.error?.message || "unknown" },
        { status: 500 }
      );
    }

    const documentId = docIns.data.id as string;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const originalPath = `${user.id}/${documentId}/original/original.pdf`;

    const up = await admin.storage.from("fds").upload(originalPath, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (up.error) {
      console.error("upload: storage upload failed", up.error);
      await admin.from("documents").delete().eq("id", documentId);
      return NextResponse.json(
        { error: "Failed to upload PDF", details: up.error.message },
        { status: 500 }
      );
    }

    const upd = await admin
      .from("documents")
      .update({ original_path: originalPath, status: "pending" })
      .eq("id", documentId);

    if (upd.error) {
      console.error("upload: documents update failed", upd.error);
      await admin.storage.from("fds").remove([originalPath]);
      await admin.from("documents").delete().eq("id", documentId);
      return NextResponse.json(
        { error: "Failed to persist document", details: upd.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, documentId });
  } catch (e: any) {
    console.error("upload: unexpected error", e);
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}