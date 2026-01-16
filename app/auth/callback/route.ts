import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tipo = requestUrl.searchParams.get('tipo');
  const company = requestUrl.searchParams.get('company');

  console.log('=== AUTH CALLBACK ===');
  console.log('Code:', code ? 'present' : 'missing');
  console.log('Tipo:', tipo);
  console.log('Company:', company);

  if (code) {
    const supabase = createClient();
    
    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code:', error);
        return NextResponse.redirect(new URL('/auth?error=callback_error', request.url));
      }

      if (!data.session) {
        console.error('No session returned');
        return NextResponse.redirect(new URL('/auth?error=no_session', request.url));
      }

      console.log('Session created for:', data.session.user.email);

      // Verificar si el usuario ya tiene rol
      const { data: existingRole, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', data.session.user.id)
        .single();

      console.log('Existing role:', existingRole);

      // Si no tiene rol y es registro de inmobiliaria, crear rol
      if (!existingRole && tipo === 'inmobiliaria') {
        console.log('Creating new inmobiliaria role...');
        
        const companyName = company ? decodeURIComponent(company) : '';
        
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.session.user.id,
            email: data.session.user.email!,
            role: 'inmobiliaria',
            company_name: companyName,
            approved: false
          });

        if (insertError) {
          console.error('Error creating role:', insertError);
          return NextResponse.redirect(new URL('/auth?error=role_creation_failed', request.url));
        }

        console.log('Role created, redirecting to pending approval');
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }

      // Si ya tiene rol aprobado, redirigir al dashboard correspondiente
      if (existingRole && existingRole.approved) {
        console.log('User approved, redirecting to dashboard:', existingRole.role);
        
        switch (existingRole.role) {
          case 'inmobiliaria':
            return NextResponse.redirect(new URL('/dashboard/inmobiliaria', request.url));
          case 'admin':
            return NextResponse.redirect(new URL('/dashboard/admin', request.url));
          case 'locador':
            return NextResponse.redirect(new URL('/dashboard/locador', request.url));
          case 'locatario':
            return NextResponse.redirect(new URL('/dashboard/locatario', request.url));
          default:
            return NextResponse.redirect(new URL('/auth?error=invalid_role', request.url));
        }
      }

      // Si no está aprobado
      if (existingRole && !existingRole.approved) {
        console.log('User not approved yet, redirecting to pending');
        return NextResponse.redirect(new URL('/pending-approval', request.url));
      }

      // Si no tiene rol y no es registro nuevo, es un caso edge
      if (!existingRole && !tipo) {
        console.log('No role and no tipo, checking if first login from contract...');
        
        // Puede ser un locador/locatario que viene de un link de firma
        // En ese caso, el rol se crea desde el API de firma
        // Por ahora, mandarlo a auth
        return NextResponse.redirect(new URL('/auth?error=no_role', request.url));
      }

    } catch (error: any) {
      console.error('Callback error:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
  }

  // Default redirect si no hay code
  console.log('No code, redirecting to auth');
  return NextResponse.redirect(new URL('/auth', request.url));
}
