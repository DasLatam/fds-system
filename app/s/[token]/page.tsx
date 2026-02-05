"use client";

import SignatureCanvas from "react-signature-canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Preview = {
  documentId: string;
  title: string;
  email: string;
  status: "pending" | "signed" | "rejected" | "expired";
  signingMode: "parallel" | "sequential";
  position: number | null;
  expiresAt: string | null;
  pdfUrl: string; // suele ser "/api/preview?token=..."
  prefill?: {
    fullName?: string | null;
    dni?: string | null;
    cuil?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

type SignerCapacity = "self" | "representing";

export default function SignPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const router = useRouter();

  const sigRef = useRef<SignatureCanvas | null>(null);

  // Refs (autofill-friendly)
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const dniRef = useRef<HTMLInputElement | null>(null);
  const cuilRef = useRef<HTMLInputElement | null>(null);
  const addressRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  // Empresa (solo si firma en representación)
  const companyNameRef = useRef<HTMLInputElement | null>(null);
  const companyCuitRef = useRef<HTMLInputElement | null>(null);
  const companyAddressRef = useRef<HTMLInputElement | null>(null);
  const companyRoleRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ separar errores
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [consent, setConsent] = useState(false);

  // Capacidad de firma
  const [signerCapacity, setSignerCapacity] = useState<SignerCapacity>("self");

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

  function readCompany() {
    const companyName = (companyNameRef.current?.value || "").trim();
    const companyCuit = onlyDigits(companyCuitRef.current?.value || "");
    const companyAddress = (companyAddressRef.current?.value || "").trim();
    const companyRole = (companyRoleRef.current?.value || "").trim();
    return { companyName, companyCuit, companyAddress, companyRole };
  }

  function applyPrefill(prefill: any) {
    if (!prefill) return;

    const setIfEmpty = (ref: any, value: any, digitsOnly = false) => {
      const el = ref?.current as HTMLInputElement | null;
      if (!el) return;
      const current = String(el.value || "").trim();
      if (current) return;

      let v = value == null ? "" : String(value).trim();
      if (!v) return;
      if (digitsOnly) v = onlyDigits(v);
      if (!v) return;

      el.value = v;
    };

    setIfEmpty(fullNameRef, prefill.fullName ?? prefill.full_name ?? null, false);
    setIfEmpty(dniRef, prefill.dni ?? null, true);
    setIfEmpty(cuilRef, prefill.cuil ?? null, true);
    setIfEmpty(addressRef, prefill.address ?? null, false);
    setIfEmpty(phoneRef, prefill.phone ?? null, true);

    // empresa si viniera (no es requisito)
    setIfEmpty(companyNameRef, prefill.companyName ?? prefill.company_name ?? null, false);
    setIfEmpty(companyCuitRef, prefill.companyCuit ?? prefill.company_cuit ?? null, true);
    setIfEmpty(companyAddressRef, prefill.companyAddress ?? prefill.company_address ?? null, false);
    setIfEmpty(companyRoleRef, prefill.companyRole ?? prefill.company_role ?? null, false);

    setTimeout(() => bump(), 0);
  }


  useEffect(() => {
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setLoadErr(null);
        setActionErr(null);
        setOk(null);

        const res = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el documento.");

        if (mounted) {
          setPreview(data as Preview);
          applyPrefill((data as any)?.prefill);
          setTimeout(() => bump(), 50);
        }
      } catch (e: any) {
        if (mounted) setLoadErr(e?.message || "Error inesperado");
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

    if (s.cuil && s.cuil.length !== 11) return false;

    if (signerCapacity === "representing") {
      const c = readCompany();
      if (!c.companyName || c.companyName.length < 2) return false;
      if (!c.companyRole || c.companyRole.length < 2) return false;
      if (!c.companyCuit || c.companyCuit.length !== 11) return false;
    }

    return true;
  }, [preview, consent, sigDirty, signerCapacity, tick]);

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

  async function refreshPreview() {
    const p = await fetch(`/api/signing-request/${token}`, { cache: "no-store" });
    const pdata = await p.json().catch(() => null);
    if (p.ok && pdata) {
      setPreview(pdata as Preview);
      applyPrefill((pdata as any)?.prefill);
    }
  }

  async function submit() {
    setActionErr(null);
    setOk(null);

    if (!preview || preview.status !== "pending") {
      setActionErr("Este enlace no está en estado pendiente.");
      return;
    }
    if (!consent) {
      setActionErr("Tenés que aceptar el consentimiento.");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setActionErr("Dibujá tu firma antes de enviar.");
      return;
    }

    const signer = readSigner();
    if (!signer.fullName || !signer.dni || !signer.cuil || !signer.address || !signer.phone) {
      setActionErr("Completá todos los datos del firmante.");
      return;
    }
    if (signer.cuil.length !== 11) {
      setActionErr("CUIL inválido: debe tener 11 dígitos (sin guiones).");
      return;
    }

    const company = readCompany();
    if (signerCapacity === "representing") {
      if (!company.companyName || company.companyName.length < 2) {
        setActionErr("Completá la razón social de la empresa.");
        return;
      }
      if (!company.companyRole || company.companyRole.length < 2) {
        setActionErr("Completá tu rol/cargo dentro de la empresa.");
        return;
      }
      if (!company.companyCuit || company.companyCuit.length !== 11) {
        setActionErr("CUIT inválido: debe tener 11 dígitos (sin guiones).");
        return;
      }
    }

    setBusy(true);
    try {
      const signatureDataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");

      const res = await fetch(`/api/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signatureDataUrl,
          consent,
          signer,

          // P1: capacidad de firma + empresa (compat)
          signerCapacity,
          signer_capacity: signerCapacity,
          signerCompanyName: company.companyName || null,
          signer_company_name: company.companyName || null,
          signerCompanyCuit: company.companyCuit || null,
          signer_company_cuit: company.companyCuit || null,
          signerCompanyAddress: company.companyAddress || null,
          signer_company_address: company.companyAddress || null,
          signerCompanyRole: company.companyRole || null,
          signer_company_role: company.companyRole || null,

          // legacy/compat
          full_name: signer.fullName,
          dni: signer.dni,
          cuil: signer.cuil,
          address: signer.address,
          phone: signer.phone,

          signer_full_name: signer.fullName,
          signer_dni: signer.dni,
          signer_cuil: signer.cuil,
          signer_address: signer.address,
          signer_phone: signer.phone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo registrar la firma.");

      setOk("La firma fue registrada correctamente.");
      await refreshPreview();

      // ✅ Post-firma: invitación a registrarse / claim de historial
      // Post-acción: llevar a /dashboard (si no hay sesión, middleware envía a /login con next).
      router.replace(`/dashboard?from=signed&token=${encodeURIComponent(token)}&status=signed`);
    } catch (e: any) {
      setActionErr(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    setActionErr(null);
    setOk(null);

    if (!preview || preview.status !== "pending") return;

    if (rejectReason.trim().length < 3) {
      setActionErr("Indicá un motivo breve de rechazo.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason: rejectReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo registrar el rechazo");

      setOk("Rechazo registrado. Se notificará al creador.");
      await refreshPreview();

      // ✅ Post-rechazo: mismo flujo que post-firma
      // Post-acción: llevar a /dashboard (si no hay sesión, middleware envía a /login con next).
      router.replace(`/dashboard?from=signed&token=${encodeURIComponent(token)}&status=rejected`);
    } catch (e: any) {
      setActionErr(e?.message || "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Cargando…</div>;

  if (loadErr) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-zinc-200 p-6">
          <h1 className="text-xl font-semibold">No se pudo abrir el enlace</h1>
          <p className="mt-2 text-sm text-zinc-700">{loadErr}</p>
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

  if (!preview) return <div className="mx-auto max-w-3xl p-6 text-sm text-zinc-600">Link inválido.</div>;

  const pdfOk = Boolean(preview.pdfUrl);

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
          {/* Vista previa */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2">
              <div className="text-sm font-medium">Vista previa</div>
              {pdfOk ? (
                <a className="text-xs underline text-zinc-700" href={preview.pdfUrl} target="_blank" rel="noreferrer">
                  Abrir PDF
                </a>
              ) : (
                <span className="text-xs text-zinc-500">No disponible</span>
              )}
            </div>

            {pdfOk ? (
              <iframe className="h-[560px] w-full" src={preview.pdfUrl} title="Vista previa PDF" />
            ) : (
              <div className="p-4 text-sm text-zinc-600">No se pudo cargar la vista previa.</div>
            )}
          </div>

          {/* Formulario + firma */}
          <div className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-sm font-semibold">Datos del firmante</h2>
            <p className="mt-1 text-xs text-zinc-600">
              Estos datos se usan para trazabilidad y evidencia de firma (Ley 25.506, art. 5).
            </p>

            <div className="mt-4 grid gap-3">
              <input
                ref={fullNameRef}
                onChange={bump}
                placeholder="Nombre completo (ej: Juan Pérez)"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                disabled={busy || preview.status !== "pending"}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  ref={dniRef}
                  onChange={bump}
                  placeholder="DNI (ej: 30123456)"
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  disabled={busy || preview.status !== "pending"}
                  inputMode="numeric"
                />
                <input
                  ref={cuilRef}
                  onChange={bump}
                  placeholder="CUIL (11 dígitos, sin guiones)"
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                  disabled={busy || preview.status !== "pending"}
                  inputMode="numeric"
                />
              </div>

              <input
                ref={phoneRef}
                onChange={bump}
                placeholder="Celular (ej: 11 5555 5555)"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                disabled={busy || preview.status !== "pending"}
                inputMode="tel"
              />

              <input
                ref={addressRef}
                onChange={bump}
                placeholder="Dirección postal completa (ej: Calle 123, Piso, Depto, Localidad, Provincia)"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                disabled={busy || preview.status !== "pending"}
              />
            </div>

            {/* Capacidad de firma */}
            <div className="mt-5 rounded-lg border border-zinc-200 p-3">
              <div className="text-sm font-semibold">Capacidad de firma</div>
              <p className="mt-1 text-xs text-zinc-600">
                Esta información puede incorporarse como evidencia en la constancia y auditoría del documento.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="radio"
                    name="signerCapacity"
                    checked={signerCapacity === "self"}
                    onChange={() => {
                      setSignerCapacity("self");
                      bump();
                    }}
                    disabled={busy || preview.status !== "pending"}
                  />
                  Firmo por mi cuenta
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="radio"
                    name="signerCapacity"
                    checked={signerCapacity === "representing"}
                    onChange={() => {
                      setSignerCapacity("representing");
                      bump();
                    }}
                    disabled={busy || preview.status !== "pending"}
                  />
                  Firmo en representación de una empresa
                </label>
              </div>

              {signerCapacity === "representing" ? (
                <div className="mt-3 grid gap-3">
                  <input
                    ref={companyNameRef}
                    onChange={bump}
                    placeholder="Razón social (ej: Empresa S.A.)"
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    disabled={busy || preview.status !== "pending"}
                  />

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      ref={companyCuitRef}
                      onChange={bump}
                      placeholder="CUIT (11 dígitos, sin guiones)"
                      className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                      disabled={busy || preview.status !== "pending"}
                      inputMode="numeric"
                    />
                    <input
                      ref={companyRoleRef}
                      onChange={bump}
                      placeholder="Rol / cargo (ej: Apoderado / Director)"
                      className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                      disabled={busy || preview.status !== "pending"}
                    />
                  </div>

                  <input
                    ref={companyAddressRef}
                    onChange={bump}
                    placeholder="Domicilio de la empresa (opcional)"
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                    disabled={busy || preview.status !== "pending"}
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-start gap-2">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={busy || preview.status !== "pending"}
                className="mt-1"
              />
              <label className="text-xs text-zinc-700">
                Declaro que leí el documento y acepto firmarlo electrónicamente. Entiendo que este servicio implementa
                firma electrónica conforme a la Ley 25.506 (República Argentina) y que no constituye firma digital
                certificada.
              </label>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Firma manuscrita</div>
                <button
                  type="button"
                  onClick={clearSig}
                  className="text-xs underline text-zinc-700"
                  disabled={busy || preview.status !== "pending"}
                >
                  Limpiar
                </button>
              </div>

              <div className="mt-2 rounded-md border border-zinc-200 overflow-hidden">
                <SignatureCanvas
                  ref={sigRef}
                  penColor="black"
                  canvasProps={{
                    className: "h-[160px] w-full bg-white",
                    onMouseUp: onSigEnd,
                    onTouchEnd: onSigEnd,
                    onPointerUp: onSigEnd,
                  }}
                />
              </div>

              <div className="mt-2 text-xs text-zinc-600">{sigDirty ? "✅ Firma capturada" : "Dibujá tu firma en el recuadro."}</div>
            </div>

            {actionErr ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{actionErr}</div>
            ) : null}

            {ok ? (
              <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{ok}</div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={submit}
                disabled={!canSign || busy}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {busy ? "Firmando…" : "Firmar y finalizar"}
              </button>

              <button
                type="button"
                onClick={reject}
                disabled={busy || preview.status !== "pending"}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-40"
              >
                Rechazar
              </button>
            </div>

            <div className="mt-3">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo de rechazo (mín. 3 caracteres)"
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                disabled={busy || preview.status !== "pending"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
