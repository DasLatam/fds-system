import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/admin'

export async function GET(_req: Request, ctx: { params: { token: string } }) {
  const token = ctx.params.token

  const { data: reqRow, error } = await supabaseAdmin
    .from('signing_requests')
    .select('id,document_id,email,status,documents(title,original_path)')
    .eq('token', token)
    .single()
  if (error || !reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const doc: any = (reqRow as any).documents
  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from('fds')
    .createSignedUrl(doc.original_path, 60 * 10)
  if (sErr || !signed) return NextResponse.json({ error: sErr?.message || 'Error' }, { status: 500 })

  return NextResponse.json({
    title: doc.title,
    email: reqRow.email,
    status: reqRow.status,
    documentId: reqRow.document_id,
    pdfUrl: signed.signedUrl
  })
}
