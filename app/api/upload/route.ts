import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const title = (form.get('title') as string | null) || 'Documento'
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF' }, { status: 400 })

  const docId = randomUUID()
  const originalPath = `${userData.user.id}/${docId}/original.pdf`

  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: upErr } = await supabaseAdmin.storage.from('fds').upload(originalPath, bytes, {
    contentType: 'application/pdf',
    upsert: true
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { error: dbErr } = await supabaseAdmin.from('documents').insert({
    id: docId,
    created_by: userData.user.id,
    title,
    status: 'pending',
    original_path: originalPath
  })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ documentId: docId })
}
