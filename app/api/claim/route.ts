import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

async function handler() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("claim_signatures");
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const claimed = typeof data === "number" ? data : Number(data || 0);

  revalidatePath("/dashboard");
  revalidatePath("/signed");

  return NextResponse.json({ ok: true, claimed });
}

export async function POST() {
  return handler();
}

export async function GET() {
  return handler();
}
