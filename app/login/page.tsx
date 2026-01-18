'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '../../lib/supabase/browser'

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `/auth/callback?next=/dashboard` }
    })
    setLoading(false)
    if (error) setMsg(error.message)
    else setMsg('Te enviamos un link de acceso a tu email.')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ingresar</h1>
      <p className="text-sm text-zinc-600">Login por Magic Link (Supabase Auth).</p>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <button className="rounded-xl bg-black px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
      {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
    </div>
  )
}
