import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
    
    // Obtener el usuario y redirigir según su rol
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Obtener el perfil del usuario para conocer su rol
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      // Redirigir según el rol
      if (profile?.role === 'inmobiliaria') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard/inmobiliaria`)
      } else if (profile?.role === 'locador') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard/locador`)
      } else if (profile?.role === 'locatario') {
        return NextResponse.redirect(`${requestUrl.origin}/dashboard/locatario`)
      }
    }
  }

  // Si algo falla, redirigir al login
  return NextResponse.redirect(`${requestUrl.origin}/auth`)
}
