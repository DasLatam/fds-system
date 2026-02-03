import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      access_token?: string;
      refresh_token?: string;
    };

    const access_token = body.access_token || "";
    const refresh_token = body.refresh_token || "";

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
    }

    // Creamos la response ahora y seteamos cookies sobre ella (determinístico)
    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.headers.set("cache-control", "no-store");

    const cookieStore = await cookies();
    type CookieOptions = Parameters<typeof res.cookies.set>[2];
    type CookieToSet = { name: string; value: string; options?: CookieOptions };

    const supabase = createServerClient(
      requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            for (const { name, value, options } of cookiesToSet) {
              res.cookies.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "set_session_error" },
      { status: 500 }
    );
  }
}