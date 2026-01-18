'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'

export default function SignPage({ params }: { params: { token: string } }) {
  const token = params.token
  const sigRef = useRef<SignatureCanvas | null>(null)
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<any>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/signing-request/${token}`)
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'No encontrado')
        setLoading(false)
        return
      }
      setInfo(json)
      setLoading(false)
    })()
  }, [token])

  const canSign = useMemo(() => info && info.status === 'pending', [info])

  async function onSubmit() {
    setMsg(null)
    if (!canSign) return
    const sig = sigRef.current
    if (!sig) return
    if (sig.isEmpty()) {
      setMsg('Por favor, firmá en el recuadro.')
      return
    }
    setSubmitting(true)
    try {
      const signatureDataUrl = sig.getTrimmedCanvas().toDataURL('image/png')
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, signatureDataUrl })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error firmando')
      setMsg('✅ Firma registrada. Se enviará el PDF final por email.')
    } catch (e: any) {
      setMsg(e.message || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Cargando...</div>
  if (!info) return <div className="text-red-600">{msg}</div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Firmar documento</h1>
        <p className="text-sm text-zinc-600">{info.title}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
        <iframe title="preview" src={info.pdfUrl} className="h-[70vh] w-full" />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="font-medium">Tu firma manuscrita</h2>
        <div className="mt-3 rounded-xl border border-zinc-200 bg-white">
          <SignatureCanvas
            ref={(r) => {
              sigRef.current = r
            }}
            penColor="black"
            canvasProps={{ width: 900, height: 220, className: 'w-full h-[220px]' }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2"
            onClick={() => sigRef.current?.clear()}
            disabled={!canSign || submitting}
          >
            Limpiar
          </button>
          <button
            className="rounded-xl bg-black px-4 py-2 text-white"
            onClick={onSubmit}
            disabled={!canSign || submitting}
          >
            {submitting ? 'Firmando...' : 'Firmar y enviar'}
          </button>
        </div>
        {!canSign ? <p className="mt-2 text-sm text-zinc-600">Este link ya fue usado.</p> : null}
        {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
      </div>
    </div>
  )
}
