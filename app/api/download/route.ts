import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const { data, error } = await supabaseAdmin.storage.from('fds').createSignedUrl(path, 60)
  if (error || !data) return NextResponse.json({ error: error?.message || 'Error' }, { status: 500 })

  return NextResponse.redirect(data.signedUrl)
}
