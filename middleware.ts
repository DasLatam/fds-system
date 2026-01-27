import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// -------- Rate limit (Edge) --------
const redis = new Redis({
  url: requiredEnv("UPSTASH_REDIS_REST_URL"),
  token: requiredEnv("UPSTASH_REDIS_REST_TOKEN"),
});

const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 req/min
  analytics: true,
  prefix: "fes_api_rl",
});

function getIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Rutas públicas (NO requieren sesión)
function isPublicPath(pathname: string) {
  // Pages públicas
  if (pathname === "/") return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/pricing")) return true;
  if (pathname.startsWith("/terms")) return true;
  if (pathname.startsWith("/privacy")) return true;

  // callbacks públicos
  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/auth/callback-client")) return true;

  // firmantes (link público)
  if (pathname.startsWith("/s/")) return true;

  // auth endpoints públicos
  if (pathname.startsWith("/api/auth/magic-link")) return true;
  if (pathname.startsWith("/api/auth/set-session")) return true;

  // ✅ endpoints públicos por token (NO sesión)
  if (pathname.startsWith("/api/signing-request")) return true; // /api/signing-request/[token]
  if (pathname.startsWith("/api/sign")) return true;            // POST firma por token
  if (pathname.startsWith("/api/reject")) return true;          // POST rechazo por token
  if (pathname.startsWith("/api/download")) return true;        // links desde email
  if (pathname.startsWith("/api/preview")) return true;         // si existe y se usa

  return false;
}

// Rutas que SÍ requieren sesión
function isProtectedPath(pathname: string) {
  // pages privadas
  if (pathname.startsWith("/dashboard")) return true;
  if (pathname.startsWith("/admin")) return true;

  // api privadas (requieren sesión)
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/api/upload")) return true;
  if (pathname.startsWith("/api/invite")) return true;
  if (pathname.startsWith("/api/audit")) return true;
  if (pathname.startsWith("/api/resend-invite")) return true;
  if (pathname.startsWith("/api/profile")) return true;
  if (pathname.startsWith("/api/logout")) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Permitir assets internos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  // 2) Rate limit sólo a /api (pero NO a /api/auth/*)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    const ip = getIp(req);
    const { success } = await apiRateLimit.limit(`ip:${ip}`);
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  // 3) Si es público, seguir sin auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 4) Si no es protegido, dejar pasar
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  // 5) Auth gate para protected
  const res = NextResponse.next();

  type CookieOptions = Parameters<typeof res.cookies.set>[2];
  type CookieToSet = { name: string; value: string; options?: CookieOptions };

  const supabase = createServerClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // ✅ Para /api/* devolvemos 401 JSON (NO redirect) para evitar POST->/login 405
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
