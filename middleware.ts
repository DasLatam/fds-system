import { createServerClient } from '@supabase/ssr';
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
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Rutas públicas
  const publicPaths = ['/', '/auth', '/registro', '/legal', '/pending-approval'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Si no hay sesión y no es ruta pública, redirigir a auth
  if (!session && !isPublicPath) {
    const redirectUrl = new URL('/auth', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión, verificar rol
  if (session) {
    try {
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', session.user.id)
        .single();

      // Si no tiene rol y está intentando acceder a dashboard
      if (!userRole && pathname.startsWith('/dashboard')) {
        const redirectUrl = new URL('/auth?error=no_role', request.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Si tiene rol pero no está aprobado
      if (userRole && !userRole.approved && pathname.startsWith('/dashboard')) {
        // Admin siempre puede entrar aunque no esté "aprobado"
        if (userRole.role !== 'admin') {
          const redirectUrl = new URL('/pending-approval', request.url);
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Verificar acceso por rol
      if (userRole) {
        const role = userRole.role;
        
        // Admin puede acceder a todo
        if (role === 'admin') {
          return response;
        }

        // Inmobiliaria solo a /dashboard/inmobiliaria
        if (role === 'inmobiliaria') {
          if (pathname.startsWith('/dashboard/admin')) {
            const redirectUrl = new URL('/dashboard/inmobiliaria', request.url);
            return NextResponse.redirect(redirectUrl);
          }
          return response;
        }

        // Locador solo a /dashboard/locador
        if (role === 'locador') {
          if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/inmobiliaria')) {
            const redirectUrl = new URL('/dashboard/locador', request.url);
            return NextResponse.redirect(redirectUrl);
          }
          return response;
        }

        // Locatario solo a /dashboard/locatario
        if (role === 'locatario') {
          if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/inmobiliaria')) {
            const redirectUrl = new URL('/dashboard/locatario', request.url);
            return NextResponse.redirect(redirectUrl);
          }
          return response;
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // En caso de error, permitir acceso (fail open)
      return response;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};