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

function humanizeError(code: string) {
  const c = (code || "").trim();

  if (!c) return "No se pudo cargar el documento.";
  if (c === "invalid_or_expired") return "Este enlace es inválido, venció o fue reemplazado por un reenvío.";
  if (c === "invalid_token") return "El enlace es inválido.";
  if (c === "document_not_found") return "No se encontró el documento asociado a este enlace.";
  if (c === "signing_request_query_failed" || c === "document_query_failed")
    return "Ocurrió un error al cargar el documento. Intentá nuevamente en unos segundos.";
  return "No se pudo cargar el documento.";
}

function formatDateTime(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // formato simple local
  return d.toLocaleString();
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const sigRef = useRef<SignatureCanvas | null>(null);

  // Refs (autofill-friendly)
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const dniRef = useRef<HTMLInputElement | null>(null);
  const cuilRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [consent, setConsent] = useState(false);

  // Para recalcular canSign cuando el usuario escribe o firma
  const [tick, setTick] = useState(0);
  const [sigDirty, setSigDirty] = useState(false);

  function bump() {
    setTick((t) => t + 1);
  }

  function onlyDigits(s: string) {
    return (s || "").replace(/\D/g, "");
  }

  function readSigner() {
    const fullName = (fullNameRef.current?.value || "").trim();
    const dni = onlyDigits(dniRef.current?.value || "");
    const cuil = onlyDigits(cuilRef.current?.value || "");
    const address = (addressRef.current?.value || "").trim();
    const phone = onlyDigits(phoneRef.current?.value || "");
    return { fullName, dni, cuil, address, phone };
  }

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setOk(null);

        const res = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data?.error || "");

        if (mounted) {
          setPreview(data as Preview);
          // tick para autofill
          setTimeout(() => bump(), 50);
        }
      } catch (e: any) {
        if (mounted) setErr(humanizeError(e?.message || ""));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  const canSign = useMemo(() => {
    if (!preview || preview.status !== "pending") return false;
    if (!consent) return false;
    if (!sigDirty) return false;

    const s = readSigner();
    const filled = s.fullName && s.dni && s.cuil && s.address && s.phone;
    if (!filled) return false;

    // Validación mínima
    if (s.cuil && s.cuil.length !== 11) return false;
    return true;
  }, [preview, consent, sigDirty, tick]);

  function clearSig() {
    sigRef.current?.clear();
    setSigDirty(false);
    bump();
  }

  function onSigEnd() {
    const empty = sigRef.current?.isEmpty() ?? true;
    setSigDirty(!empty);
    bump();
  }

  async function submit() {
    setErr(null);
    setOk(null);

    if (!preview || preview.status !== "pending") {
      setErr("Este enlace no está en estado pendiente.");
      return;
    }
    if (!consent) {
      setErr("Tenés que aceptar el consentimiento.");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr("Dibujá tu firma antes de enviar.");
      return;
    }

    const signer = readSigner();
    if (!signer.fullName || !signer.dni || !signer.cuil || !signer.address || !signer.phone) {
      setErr("Completá todos los datos del firmante.");
      return;
    }
    if (signer.cuil.length !== 11) {
      setErr("CUIL inválido: debe tener 11 dígitos (sin guiones).");
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
      setErr(humanizeError(e?.message || "") || "Error inesperado");
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
      setErr(humanizeError(e?.message || "") || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Cargando…</div>;

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
            <a href="/" className="inline-block rounded-md border border-zinc-200 px-4 py-2 text-sm">
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Link inválido.</div>;

  // ✅ Acepta URL relativa (/api/preview?token=...)
  const pdfOk = Boolean(preview.pdfUrl);

  const expiresLabel = formatDateTime(preview.expiresAt);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-600">Firma Electrónica Simple</p>
            <h1 className="mt-1 text-2xl font-semibold">{preview.title || "Documento"}</h1>

            <p className="mt-2 text-sm text-zinc-600">
              Firmante: <span className="font-medium text-zinc-900">{preview.email || "—"}</span>
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Modo: <span className="font-medium text-zinc-700">{preview.signingMode || "—"}</span>
              {preview.signingMode === "sequential" && preview.position ? ` · Orden ${preview.position}` : ""}
              {expiresLabel ? ` · Vence: ${expiresLabel}` : ""}
            </p>
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Preview */}
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
              <div className="text-sm font-medium">Vista previa</div>

              {pdfOk ? (
                <a
                  href={preview.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-zinc-200 px-3 py-1 text-xs"
                >
                  Abrir PDF
                </a>
              ) : null}
            </div>

            <div className="bg-white">
              {pdfOk ? (
                <iframe title="PDF" src={preview.pdfUrl} className="h-[560px] w-full" />
              ) : (
                <div className="p-4 text-sm text-zinc-600">No se pudo cargar la vista previa.</div>
              )}
            </div>
          </div>

          {/* Form + firma */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Datos del firmante</h2>
            <p className="mt-1 text-xs text-zinc-600">
              Estos datos se usan para trazabilidad y evidencia de firma.
            </p>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs">
                <span className="text-zinc-700">Nombre completo</span>
                <input
                  ref={fullNameRef}
                  onChange={bump}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  disabled={busy || preview.status !== "pending"}
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs">
                  <span className="text-zinc-700">DNI</span>
                  <input
                    ref={dniRef}
                    onChange={bump}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    placeholder="30123456"
                    inputMode="numeric"
                    disabled={busy || preview.status !== "pending"}
                  />
                </label>

                <label className="grid gap-1 text-xs">
                  <span className="text-zinc-700">CUIT/CUIL</span>
                  <input
                    ref={cuilRef}
                    onChange={bump}
                    className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    placeholder="20301234567"
                    inputMode="numeric"
                    disabled={busy || preview.status !== "pending"}
                  />
                </label>
              </div>

              <label className="grid gap-1 text-xs">
                <span className="text-zinc-700">Dirección postal completa</span>
                <input
                  ref={addressRef}
                  onChange={bump}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="Calle 123, Piso 4, Depto A, Localidad, Provincia"
                  autoComplete="street-address"
                  disabled={busy || preview.status !== "pending"}
                />
              </label>

              <label className="grid gap-1 text-xs">
                <span className="text-zinc-700">Celular</span>
                <input
                  ref={phoneRef}
                  onChange={bump}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="1134567890"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={busy || preview.status !== "pending"}
                />
              </label>

              <label className="mt-2 flex items-start gap-2 text-xs text-zinc-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={busy || preview.status !== "pending"}
                  className="mt-1"
                />
                <span>
                  Declaro que acepto firmar electrónicamente este documento conforme a la Ley 25.506 (art. 5) y que los
                  datos ingresados son verídicos.
                </span>
              </label>

              <div className="mt-2 rounded-lg border border-zinc-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-zinc-900">Firma manuscrita</div>
                  <button
                    type="button"
                    onClick={clearSig}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                    disabled={busy || preview.status !== "pending"}
                  >
                    Limpiar
                  </button>
                </div>

                <div className="mt-2 overflow-hidden rounded-md border border-zinc-200 bg-white">
                  <SignatureCanvas
  ref={sigRef}
  penColor="black"
  canvasProps={{
    className: "h-[160px] w-full",
    onMouseUp: onSigEnd,
    onTouchEnd: onSigEnd,
  }}
/>

                </div>

                <p className="mt-2 text-[11px] text-zinc-600">
                  Tip: firmá con el dedo (móvil) o con el mouse/trackpad.
                </p>
              </div>

              {ok ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {ok}
                </div>
              ) : null}

              {err ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</div>
              ) : null}

              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSign || busy}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Enviando…" : "Firmar"}
                </button>

                <button
                  type="button"
                  onClick={reject}
                  disabled={busy || preview.status !== "pending"}
                  className="rounded-md border border-zinc-200 px-4 py-2 text-sm"
                >
                  {busy ? "Enviando…" : "Rechazar"}
                </button>

                <input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motivo (mín. 3 caracteres)"
                  className="flex-1 min-w-[220px] rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  disabled={busy || preview.status !== "pending"}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Este servicio implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma
          digital certificada.
        </p>
      </div>
    </div>
  );
}