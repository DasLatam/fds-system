"use client";

import SignatureCanvas from "react-signature-canvas";
import { useEffect, useMemo, useRef, useState } from "react";

type Preview = {
  documentId: string;
  title: string;
  email: string;
  status: "pending" | "signed";
  signingMode: "parallel" | "sequential";
  position: number | null;
  pdfUrl: string;
};

export default function SignPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  const [consent, setConsent] = useState(false);
  const [signer, setSigner] = useState({
    fullName: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  });

  const canSign = useMemo(() => {
    if (!preview || preview.status === "signed") return false;
    const filled = signer.fullName && signer.dni && signer.cuil && signer.address && signer.phone;
    return Boolean(filled) && consent;
  }, [preview, signer, consent]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/signing-request/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "No se pudo cargar el documento.");
        }
        if (mounted) setPreview(data as Preview);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Error inesperado");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  function clearSig() {
    sigRef.current?.clear();
  }

  async function submit() {
    setErr(null);
    setOk(null);
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr("Dibujá tu firma antes de enviar.");
      return;
    }
    if (!canSign) {
      setErr("Completá tus datos y aceptá el consentimiento.");
      return;
    }

    setBusy(true);
    try {
      const signatureDataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/sign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, signatureDataUrl, consent, signer }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo registrar la firma.");
      }
      setOk("Firma registrada. ¡Gracias!");
      // refresh preview
      const p = await fetch(`/api/signing-request/${token}`);
      const pdata = await p.json();
      if (p.ok) setPreview(pdata as Preview);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Cargando…</div>;
  }
  if (err) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-red-600">{err}</div>;
  }
  if (!preview) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Link inválido.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-600">Firma Digital Simple</p>
            <h1 className="mt-1 text-2xl font-semibold">{preview.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">Firmante: <span className="font-medium text-zinc-900">{preview.email}</span></p>
            {preview.signingMode === "sequential" && preview.position ? (
              <p className="mt-1 text-xs text-zinc-500">Modo secuencial · Orden: {preview.position}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">Modo: {preview.signingMode}</p>
            )}
          </div>

          <div>
            {preview.status === "signed" ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Ya firmado</span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Pendiente</span>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium">Vista previa</div>
            <iframe title="PDF" src={preview.pdfUrl} className="h-[640px] w-full" />
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="text-sm font-medium">Datos del firmante</div>
              <p className="mt-1 text-xs text-zinc-600">Se usan como evidencia y registro (Ley 25.506 art. 5).</p>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <input className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Nombre completo" value={signer.fullName} onChange={(e) => setSigner({ ...signer, fullName: e.target.value })} />
                <input className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="DNI" value={signer.dni} onChange={(e) => setSigner({ ...signer, dni: e.target.value })} />
                <input className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="CUIL" value={signer.cuil} onChange={(e) => setSigner({ ...signer, cuil: e.target.value })} />
                <input className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Celular" value={signer.phone} onChange={(e) => setSigner({ ...signer, phone: e.target.value })} />
                <input className="rounded-md border border-zinc-200 px-3 py-2 text-sm md:col-span-2" placeholder="Dirección postal" value={signer.address} onChange={(e) => setSigner({ ...signer, address: e.target.value })} />
              </div>

              <label className="mt-3 flex items-start gap-2 text-xs text-zinc-600">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                <span>
                  Confirmo que leí el documento, que mi firma expresa mi voluntad y autorizo el registro de evidencia (hash, IP y timestamps) conforme a la Ley 25.506 (art. 5).
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Firma manuscrita</div>
                <button type="button" onClick={clearSig} className="text-xs text-zinc-600 hover:text-zinc-900">Limpiar</button>
              </div>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-white">
                <SignatureCanvas
                  ref={(r) => { sigRef.current = r; }}
                  canvasProps={{ className: "w-full h-[220px]" }}
                  backgroundColor="#ffffff"
                />
              </div>
              <p className="mt-2 text-xs text-zinc-600">Usá mouse o dedo. Luego presioná “Firmar”.</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSign || preview.status === "signed" || busy}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {busy ? "Enviando..." : "Firmar"}
                </button>
                {ok ? <span className="text-sm text-emerald-700">{ok}</span> : null}
                {err ? <span className="text-sm text-red-600">{err}</span> : null}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4 text-xs text-zinc-600">
              <div className="font-medium text-zinc-900">Privacidad</div>
              <p className="mt-1">La evidencia se almacena hasta 10 años con acceso restringido. Para terceros, solo por orden judicial.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
