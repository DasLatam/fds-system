"use client";

import SignatureCanvas from "react-signature-canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Preview = {
  documentId: string;
  title: string;
  email: string;
  status: "pending" | "signed" | "rejected" | "expired";
  signingMode: "parallel" | "sequential";
  position: number | null;
  expiresAt: string | null;
  pdfUrl: string;
};

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const sigRef = useRef<SignatureCanvas | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [consent, setConsent] = useState(false);
  const [signer, setSigner] = useState({
    fullName: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  });

  const canSign = useMemo(() => {
    if (!preview || preview.status !== "pending") return false;
    const filled = signer.fullName && signer.dni && signer.cuil && signer.address && signer.phone;
    return Boolean(filled) && consent;
  }, [preview, signer, consent]);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el documento.");

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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo registrar la firma.");

      setOk("Firma registrada. ¡Gracias!");
      const p = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
      const pdata = await p.json().catch(() => null);
      if (p.ok && pdata) setPreview(pdata as Preview);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setErr(null);
    setOk(null);
    if (!preview || preview.status !== "pending") return;

    if (rejectReason.trim().length < 3) {
      setErr("Indicá un motivo breve de rechazo.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, reason: rejectReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo registrar el rechazo");

      setOk("Rechazo registrado. Se notificará al creador.");
      const p = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
      const pdata = await p.json().catch(() => null);
      if (p.ok && pdata) setPreview(pdata as Preview);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Cargando…</div>;
  }

  // ✅ Mejor UX cuando es inválido/expirado
  if (err) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-zinc-200 p-6">
          <h1 className="text-xl font-semibold">No se pudo abrir el enlace</h1>
          <p className="mt-2 text-sm text-zinc-700">{err}</p>
          <p className="mt-3 text-sm text-zinc-600">
            Este enlace puede haber vencido o haber sido reemplazado por un reenvío. Pedile al creador del documento que
            te reenvíe la invitación.
          </p>
          <div className="mt-6">
            <a href="/" className="rounded-md border border-zinc-200 px-4 py-2 text-sm inline-block">
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) {
    return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Link inválido.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-600">Firma Electrónica Simple</p>
            <h1 className="mt-1 text-2xl font-semibold">{preview.title}</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Firmante: <span className="font-medium text-zinc-900">{preview.email}</span>
            </p>
            {preview.signingMode === "sequential" && preview.position ? (
              <p className="mt-1 text-xs text-zinc-500">Modo secuencial · Orden: {preview.position}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">Modo: {preview.signingMode}</p>
            )}
          </div>

          <div>
            {preview.status === "signed" ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Ya firmado</span>
            ) : preview.status === "rejected" ? (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">Rechazado</span>
            ) : preview.status === "expired" ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">Vencido</span>
            ) : (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Pendiente</span>
            )}
          </div>
        </div>

        {preview.expiresAt ? (
          <p className="mt-2 text-xs text-zinc-500">Vence: {new Date(preview.expiresAt).toLocaleString("es-AR")}</p>
        ) : null}

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
                <SignatureCanvas ref={(r) => { sigRef.current = r; }} canvasProps={{ className: "w-full h-[220px]" }} backgroundColor="#ffffff" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSign || busy}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {busy ? "Enviando..." : "Firmar"}
                </button>

                {preview.status === "pending" ? (
                  <button type="button" onClick={reject} disabled={busy} className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
                    Rechazar
                  </button>
                ) : null}

                {ok ? <span className="text-sm text-emerald-700">{ok}</span> : null}
                {err ? <span className="text-sm text-red-600">{err}</span> : null}
              </div>

              {preview.status === "pending" ? (
                <div className="mt-3">
                  <label className="text-xs text-zinc-600">Motivo de rechazo</label>
                  <textarea className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
