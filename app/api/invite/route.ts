import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

const schema = z.object({
  documentId: z.string().uuid(),
  emails: z.array(z.string().email()).min(1)
})

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { documentId, emails } = parsed.data
  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .select('id,title,created_by')
    .eq('id', documentId)
    .single()
  if (docErr || !doc) return NextResponse.json({ error: docErr?.message || 'Doc not found' }, { status: 404 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM || 'FDS <no-reply@example.com>'

  const rows = emails.map((email) => ({
    document_id: documentId,
    email,
    token: randomUUID(),
    status: 'pending'
  }))

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from('signing_requests')
    .insert(rows)
    .select('email,token')
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  // send emails
  const base = appUrl()
  const results = await Promise.all(
    (inserted || []).map((r) =>
      resend.emails.send({
        from,
        to: r.email,
        subject: `Firma requerida: ${doc.title}`,
        html: `
          <div style="font-family:ui-sans-serif,system-ui">
            <h2>Te solicitaron firmar un documento</h2>
            <p><strong>${doc.title}</strong></p>
            <p>Para ver y firmar, abrí este link único:</p>
            <p><a href="${base}/s/${r.token}">${base}/s/${r.token}</a></p>
            <p style="color:#666">Si no esperabas este email, podés ignorarlo.</p>
          </div>
        `.trim()
      })
    )
  )

  const failures = results.filter((r) => (r as any).error).length
  if (failures) {
    return NextResponse.json({ error: 'Some emails failed to send' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
