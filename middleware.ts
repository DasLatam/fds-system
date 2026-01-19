import { NextResponse, type NextRequest } from "next/server";
import { apiRateLimit } from "@/lib/security/ratelimit";

export async function middleware(req: NextRequest) {
  // Rate limit API only
  if (req.nextUrl.pathname.startsWith("/api")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "unknown";

    const { success } = await apiRateLimit.limit(`ip:${ip}`);
    if (!success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
