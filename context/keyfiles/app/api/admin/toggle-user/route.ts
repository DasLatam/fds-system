import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerEmail } from "@/lib/security/owner";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!isOwnerEmail(user.email)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await req.formData();
  const userId = String(form.get("user_id") || "");
  const pause = String(form.get("pause") || "0") === "1";
  if (!userId) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert({
    user_id: userId,
    is_paused: pause,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
