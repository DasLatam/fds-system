import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

function appOrigin(req: NextRequest) {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (raw && (raw.startsWith("http://") || raw.startsWith("https://"))) return raw;
  if (raw) return `https://${raw}`;
  return new URL(req.url).origin;
}

function safeNextPath(next: string | null) {
  if (!next) return "/dashboard";
  // solo paths internos
  if (!next.startsWith("/")) return "/dashboard";
  if (next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(req: NextRequest) {
  const origin = appOrigin(req);
  const url = new URL(req.url);
  const next = safeNextPath(url.searchParams.get("next"));

  const code = url.searchParams.get("code");

  // ✅ Caso PKCE normal
  if (code) {
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
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("exchangeCodeForSession error:", error);
      const msg = encodeURIComponent(error.message);
      return Response.redirect(
        new URL(`/login?error=auth_callback_failed&msg=${msg}`, origin),
        302
      );
    }

    return Response.redirect(new URL(next, origin), 302);
  }

  // ✅ Caso IMPlicit/hash (o cualquier redirect que llegue sin ?code=):
  // devolvemos un HTML que corre en el browser y preserva location.hash
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Redirigiendo…</title>
</head>
<body>
  <p style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    Redirigiendo…
  </p>
  <script>
    (function () {
      var hash = window.location.hash || "";
      var search = window.location.search || "";
      // Si hay tokens o error en hash, lo pasamos a callback-client preservando hash
      if (hash.includes("access_token=") || hash.includes("refresh_token=") || hash.includes("error=")) {
        window.location.replace("/auth/callback-client" + search + hash);
        return;
      }
      // si no hay nada, volvemos al login con missing_code (caso URL mal formada/vieja)
      window.location.replace("/login?error=missing_code");
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}