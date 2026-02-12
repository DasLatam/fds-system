import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Schema = z.object({
  side: z.enum(["front", "back"]),
});

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function extFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("pdf")) return "pdf";
  return "jpg";
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const admin = createAdminClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return json(401, { error: "auth_error", details: userErr.message });
  if (!user) return json(401, { error: "unauthorized" });

  const form = await req.formData().catch(() => null);
  if (!form) return json(400, { error: "invalid_body" });

  const side = String(form.get("side") || "");
  const parsed = Schema.safeParse({ side });
  if (!parsed.success) return json(400, { error: "invalid_body" });

  const file = form.get("file");
  if (!(file instanceof File)) return json(400, { error: "missing_file" });

  const maxBytes = 6 * 1024 * 1024; // 6MB
  if (file.size > maxBytes) return json(400, { error: "file_too_large" });

  const mime = file.type || "application/octet-stream";
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(mime)) return json(400, { error: "invalid_file_type" });

  const ext = extFromMime(mime);
  const bucket = "fds";
  const key = `identity/${user.id}/dni_${parsed.data.side}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await admin.storage.from(bucket).upload(key, bytes, {
    upsert: true,
    contentType: mime,
    cacheControl: "3600",
  });

  if (upload.error) {
    console.error("identity upload error", upload.error);
    return json(500, { error: "upload_failed" });
  }

  const updateCol = parsed.data.side === "front" ? "dni_front_path" : "dni_back_path";
  const upd = await admin
    .from("profiles")
    .update({ [updateCol]: key, updated_at: new Date().toISOString() } as any)
    .eq("user_id", user.id);

  if (upd.error) {
    console.error("profiles update after identity upload error", upd.error);
    return json(500, { error: "db_error" });
  }

  return json(200, { ok: true, path: key, side: parsed.data.side });
}
