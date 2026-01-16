import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/', '/auth', '/registro', '/legal', '/firma'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  // Si no hay sesión y está intentando acceder a ruta protegida
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Si hay sesión, verificar rol
  if (session && request.nextUrl.pathname.startsWith('/dashboard')) {
    try {
      // Obtener rol del usuario
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return NextResponse.redirect(new URL('/auth?error=no_role', request.url));
      }

      // Verificar si está aprobado
      if (!userRole.approved) {
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }

      // Verificar acceso según rol
      const path = request.nextUrl.pathname;

      if (path.startsWith('/dashboard/admin') && userRole.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/inmobiliaria', request.url));
      }

      if (path.startsWith('/dashboard/inmobiliaria') && userRole.role !== 'inmobiliaria') {
        if (userRole.role === 'locador') {
          return NextResponse.redirect(new URL('/dashboard/locador', request.url));
        }
        if (userRole.role === 'locatario') {
          return NextResponse.redirect(new URL('/dashboard/locatario', request.url));
        }
        if (userRole.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }

      if (path.startsWith('/dashboard/locador') && userRole.role !== 'locador') {
        if (userRole.role === 'inmobiliaria') {
          return NextResponse.redirect(new URL('/dashboard/inmobiliaria', request.url));
        }
        if (userRole.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }

      if (path.startsWith('/dashboard/locatario') && userRole.role !== 'locatario') {
        if (userRole.role === 'inmobiliaria') {
          return NextResponse.redirect(new URL('/dashboard/inmobiliaria', request.url));
        }
        if (userRole.role === 'admin') {
          return NextResponse.redirect(new URL('/dashboard/admin', request.url));
        }
      }

    } catch (error) {
      console.error('Middleware error:', error);
      return NextResponse.redirect(new URL('/auth?error=middleware_error', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
