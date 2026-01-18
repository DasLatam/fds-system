import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { apiRateLimit } from './lib/security/ratelimit'

function getClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        }
      }
    }
  )
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Rate limit only API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || 'unknown'
    const { success } = await apiRateLimit.limit(`ip:${ip}`)
    if (!success) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    return res
  }

  // Protect dashboard
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const supabase = getClient(req, res)
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      const url = req.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
