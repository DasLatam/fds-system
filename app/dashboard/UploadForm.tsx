'use client'

import { useState } from 'react'

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [emails, setEmails] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!file) {
      setMsg('Seleccioná un PDF.')
      return
    }
    setLoading(true)

    try {
      // 1) Upload PDF
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title || file.name)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      const upJson = await up.json()
      if (!up.ok) throw new Error(upJson.error || 'Error subiendo PDF')

      // 2) Invite
      const list = emails
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)

      if (list.length === 0) {
        setMsg('PDF subido. Ahora agregá emails para invitar.')
        setLoading(false)
        return
      }

      const inv = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: upJson.documentId, emails: list })
      })
      const invJson = await inv.json()
      if (!inv.ok) throw new Error(invJson.error || 'Error enviando invitaciones')

      setMsg(`Listo: ${list.length} invitación(es) enviadas.`)
      setFile(null)
      setTitle('')
      setEmails('')
      // refresh list
      window.location.reload()
    } catch (err: any) {
      setMsg(err?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Nuevo documento</h2>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          placeholder="Título (opcional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <textarea
          className="h-24 w-full rounded-xl border border-zinc-200 px-3 py-2"
          placeholder="Emails de firmantes (separados por coma o salto de línea)"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
        <button className="rounded-xl bg-black px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Procesando...' : 'Subir e invitar'}
        </button>
      </form>
      {msg ? <p className="mt-3 text-sm text-zinc-700">{msg}</p> : null}
    </div>
  )
}
