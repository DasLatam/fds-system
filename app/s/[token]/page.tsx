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

function normalizePreview(raw: any, token: string): Preview {
  const documentId = raw?.documentId || raw?.document_id || "";
  const title = raw?.title || "Documento";
  const email = raw?.email || "";
  const statusRaw = (raw?.status || "pending").toString().toLowerCase();
  const status =
    statusRaw === "signed" || statusRaw === "rejected" || statusRaw === "expired"
      ? statusRaw
      : "pending";

  const signingModeRaw = (raw?.signingMode || raw?.signing_mode || "parallel").toString().toLowerCase();
  const signingMode = signingModeRaw === "sequential" ? "sequential" : "parallel";

  const position = raw?.position ?? null;
  const expiresAt = raw?.expiresAt ?? raw?.expires_at ?? null;

  // ✅ si el backend no manda pdfUrl, usamos el preview interno
  const pdfUrl = raw?.pdfUrl || raw?.pdf_url || `/api/preview?token=${encodeURIComponent(token)}`;

  return { documentId, title, email, status, signingMode, position, expiresAt, pdfUrl };
}

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";

  const sigRef = useRef<SignatureCanvas | null>(null);

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
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el documento.");

        if (mounted) {
          setPreview(normalizePreview(data, token));
          setTimeout(() => bump(), 50);
        }
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

  const reason = useMemo(() => {
    if (!preview) return "Cargando...";
    if (preview.status !== "pending") return "Este enlace no está pendiente.";
    if (!consent) return "Tenés que aceptar el consentimiento.";
    if (!sigDirty) return "Tenés que dibujar la firma.";
    const s = readSigner();
    if (!s.fullName || !s.dni || !s.cuil || !s.address || !s.phone) return "Completá todos los datos.";
    if (s.cuil.length !== 11) return "CUIL inválido: debe tener 11 dígitos (sin guiones).";
    return null;
  }, [preview, consent, sigDirty, tick]);

  const canSign = useMemo(() => reason === null, [reason]);

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

  function openPdfSameTab() {
    if (!preview?.pdfUrl) return;
    window.location.href = preview.pdfUrl; // ✅ no depende de target=_blank
  }

  async function submit() {
    setErr(null);
    setOk(null);

    if (!canSign) {
      setErr(reason || "No se puede firmar todavía.");
      return;
    }

    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr("Dibujá tu firma antes de enviar.");
      return;
    }

    const signer = readSigner();

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
      if (p.ok && pdata) setPreview(normalizePreview(pdata, token));
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
      if (p.ok && pdata) setPreview(normalizePreview(pdata, token));
    } catch (e: any) {
      setErr(e?.message || "Error inesperado");
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
          <div className="mt-6">
            <a href="/" className="rounded-md border border-zinc-200 px-4 py-2 text-sm inline-block">
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!preview) return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Link inválido.</div>;

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
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
              <div className="text-sm font-medium">Vista previa</div>

              {/* ✅ Botón real, no depende de target=_blank */}
              <button
                type="button"
                onClick={openPdfSameTab}
                className="text-xs text-zinc-600 hover:text-zinc-900"
              >
                Abrir PDF
              </button>
            </div>

            {/* ✅ object suele renderizar mejor PDFs que iframe en algunos navegadores */}
            <object data={preview.pdfUrl} type="application/pdf" className="h-[640px] w-full">
              <div className="p-4 text-sm text-zinc-600">
                No se pudo mostrar la vista previa.{" "}
                <button type="button" onClick={openPdfSameTab} className="underline">
                  Abrir PDF
                </button>
              </div>
            </object>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="text-sm font-medium">Datos del firmante</div>
              <p className="mt-1 text-xs text-zinc-600">Se usan como evidencia y registro (Ley 25.506 art. 5).</p>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <input ref={fullNameRef} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Nombre completo" onInput={bump} />
                <input ref={dniRef} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="DNI" inputMode="numeric" onInput={bump} />
                <input ref={cuilRef} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="CUIL (11 dígitos)" inputMode="numeric" onInput={bump} />
                <input ref={phoneRef} className="rounded-md border border-zinc-200 px-3 py-2 text-sm" placeholder="Celular" inputMode="tel" onInput={bump} />
                <input ref={addressRef} className="rounded-md border border-zinc-200 px-3 py-2 text-sm md:col-span-2" placeholder="Dirección postal" onInput={bump} />
              </div>

              <label className="mt-3 flex items-start gap-2 text-xs text-zinc-600">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    bump();
                  }}
                  className="mt-0.5"
                />
                <span>
                  Confirmo que leí el documento, que mi firma expresa mi voluntad y autorizo el registro de evidencia
                  (hash, IP y timestamps) conforme a la Ley 25.506 (art. 5).
                </span>
              </label>
            </div>

            <div className="rounded-xl border border-zinc-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">Firma manuscrita</div>
                <button type="button" onClick={clearSig} className="text-xs text-zinc-600 hover:text-zinc-900">
                  Limpiar
                </button>
              </div>

              <div className="mt-2 text-xs">
                {sigDirty ? (
                  <span className="text-emerald-700">✅ Firma capturada</span>
                ) : (
                  <span className="text-zinc-500">Dibujá tu firma dentro del recuadro</span>
                )}
              </div>

              <div className="mt-3 rounded-lg border border-zinc-200 bg-white">
                <SignatureCanvas
                  ref={(r) => {
                    sigRef.current = r;
                  }}
                  canvasProps={{
                    className: "w-full h-[220px]",
                    onMouseUp: onSigEnd,
                    onTouchEnd: onSigEnd,
                  }}
                  backgroundColor="#ffffff"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSign || busy}
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  title={reason ?? "Listo para firmar"}
                >
                  {busy ? "Enviando..." : "Firmar"}
                </button>

                {preview.status === "pending" ? (
                  <button
                    type="button"
                    onClick={reject}
                    disabled={busy}
                    className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium"
                  >
                    Rechazar
                  </button>
                ) : null}

                {reason ? <span className="text-xs text-zinc-600">{reason}</span> : null}
                {ok ? <span className="text-sm text-emerald-700">{ok}</span> : null}
                {err ? <span className="text-sm text-red-600">{err}</span> : null}
              </div>

              {preview.status === "pending" ? (
                <div className="mt-3">
                  <label className="text-xs text-zinc-600">Motivo de rechazo</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
