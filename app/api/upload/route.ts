import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const title = String(form.get("title") || "").trim();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing PDF file" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const docId = randomUUID();
    const safeTitle = title || file.name || "Documento";

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Path: userId/docId/original.pdf
    const originalPath = `${user.id}/${docId}/original.pdf`;

    const uploadRes = await admin.storage
      .from("fds")
      .upload(originalPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadRes.error) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadRes.error.message}` },
        { status: 500 }
      );
    }

    const insertRes = await supabase.from("documents").insert({
      id: docId,
      created_by: user.id,
      title: safeTitle,
      status: "pending",
      original_path: originalPath,
    });

    if (insertRes.error) {
      // rollback storage si falla DB
      await admin.storage.from("fds").remove([originalPath]);

      return NextResponse.json(
        { error: `DB insert failed: ${insertRes.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ documentId: docId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}