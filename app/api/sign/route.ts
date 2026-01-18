import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { signPdf } from '../../../lib/pdf/signPdf'
import { createHash } from 'crypto'
import { Resend } from 'resend'

const schema = z.object({
  token: z.string().uuid(),
  signatureDataUrl: z.string().min(50)
})

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const m = dataUrl.match(/^data:(.+);base64,(.+)$/)
  if (!m) throw new Error('Bad signature format')
  const b64 = m[2]
  const buf = Buffer.from(b64, 'base64')
  return new Uint8Array(buf)
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 })

  const { token, signatureDataUrl } = parsed.data

  const { data: sr, error: srErr } = await supabaseAdmin
    .from('signing_requests')
    .select('id,document_id,email,status')
    .eq('token', token)
    .single()
  if (srErr || !sr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sr.status !== 'pending') return NextResponse.json({ error: 'Already signed' }, { status: 409 })

  const { data: doc, error: docErr } = await supabaseAdmin
    .from('documents')
    .select('id,title,created_by,original_path')
    .eq('id', sr.document_id)
    .single()
  if (docErr || !doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Download original
  const { data: dl, error: dlErr } = await supabaseAdmin.storage.from('fds').download(doc.original_path)
  if (dlErr || !dl) return NextResponse.json({ error: dlErr?.message || 'Download error' }, { status: 500 })
  const originalBytes = new Uint8Array(await dl.arrayBuffer())

  // Hash
  const hash = createHash('sha256').update(originalBytes).digest('hex')
  const signatureBytes = dataUrlToBytes(signatureDataUrl)

  const timestampIso = new Date().toISOString()
  const finalBytes = await signPdf({
    originalPdfBytes: originalBytes,
    signaturePngBytes: signatureBytes,
    seal: {
      originalHashSha256: hash,
      signerIp: ip,
      timestampIso,
      signerEmail: sr.email
    }
  })

  const finalPath = `${doc.created_by}/${doc.id}/final.pdf`
  const { error: upErr } = await supabaseAdmin.storage.from('fds').upload(finalPath, finalBytes, {
    contentType: 'application/pdf',
    upsert: true
  })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  await supabaseAdmin
    .from('documents')
    .update({ status: 'signed', final_path: finalPath, original_hash: hash })
    .eq('id', doc.id)

  await supabaseAdmin
    .from('signing_requests')
    .update({ status: 'signed', signed_at: timestampIso, signer_ip: ip, signature_hash: createHash('sha256').update(signatureBytes).digest('hex') })
    .eq('id', sr.id)

  // Notify
  const { data: signers } = await supabaseAdmin
    .from('signing_requests')
    .select('email,status')
    .eq('document_id', doc.id)

  const { data: creator } = await supabaseAdmin.auth.admin.getUserById(doc.created_by)
  const to = Array.from(
    new Set([
      creator?.user?.email || undefined,
      ...(signers || []).map((s) => s.email)
    ].filter(Boolean) as string[])
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM || 'FDS <no-reply@example.com>'
  const base = appUrl()
  const dlUrl = `${base}/api/download?path=${encodeURIComponent(finalPath)}`

  await resend.emails.send({
    from,
    to,
    subject: `Documento firmado: ${doc.title}`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui">
        <h2>Documento firmado</h2>
        <p><strong>${doc.title}</strong></p>
        <p>Descargar PDF final:</p>
        <p><a href="${dlUrl}">${dlUrl}</a></p>
        <hr/>
        <p style="color:#666">Sello FDS incluye: Hash SHA-256 del original, IP y timestamp del servidor.</p>
      </div>
    `.trim()
  })

  return NextResponse.json({ ok: true })
}
