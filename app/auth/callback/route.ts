import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // PKCE flow: viene ?code=...
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  // Si NO hay code, igual redirigimos a la página client callback
  // para que consuma implicit hash tokens si existen.
  if (!code) {
  const toClient = new URL(
    `/auth/callback-client?next=${encodeURIComponent(next)}`,
    req.url
  );
  return NextResponse.redirect(toClient);
}


  const cookieStore = await cookies();

  type CookieOptions = Parameters<typeof cookieStore.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", req.url));
  }

  return NextResponse.redirect(new URL(next, req.url));
}