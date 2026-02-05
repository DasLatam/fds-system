"use client";

import { useMemo, useState } from "react";
import { PLAN_DEFINITIONS, formatArs, planCodeFromChoice, type PlanChoice } from "@/lib/plans";

type Props = {
  next: string;
  initial: {
    email: string;
    fullName: string;
    dni: string;
    cuil: string;
    address: string;
    phone: string;
    planHint: string; // "free" | "pro" (legacy)
  };
};

export default function OnboardingForm({ next, initial }: Props) {
  const defaultPlan: PlanChoice = useMemo(() => {
    // legacy hint: si venía "pro", sugerimos individual_pro
    return initial.planHint?.toLowerCase() === "pro" ? "individual_pro" : "free";
  }, [initial.planHint]);

  const [plan, setPlan] = useState<PlanChoice>(defaultPlan);

  // Datos personales (profiles)
  const [fullName, setFullName] = useState(initial.fullName);
  const [dni, setDni] = useState(initial.dni);
  const [cuil, setCuil] = useState(initial.cuil);
  const [address, setAddress] = useState(initial.address);
  const [phone, setPhone] = useState(initial.phone);

  // Empresa (accounts + account_members)
  const [companyName, setCompanyName] = useState("");
  const [companyCuit, setCompanyCuit] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyRole, setCompanyRole] = useState("");

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  function onlyDigits(s: string) {
    return (s || "").replace(/\D/g, "");
  }

  function validateBasic() {
    if (!fullName.trim()) return "Ingresá tu nombre y apellido.";

    const dniD = onlyDigits(dni);
    const cuilD = onlyDigits(cuil);
    const phoneD = onlyDigits(phone);

    if (!dniD) return "Ingresá tu DNI.";
    if (!cuilD) return "Ingresá tu CUIL/CUIT.";
    if (!address.trim()) return "Ingresá tu domicilio.";
    if (!phoneD) return "Ingresá tu teléfono.";

    if (plan === "company_pro") {
      if (!companyName.trim()) return "Ingresá la razón social.";
      if (!onlyDigits(companyCuit)) return "Ingresá el CUIT de la empresa.";
      if (!companyAddress.trim()) return "Ingresá el domicilio de la empresa.";
      if (!companyRole.trim()) return "Ingresá tu rol como representante (ej: Representante legal).";
    }

    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    const err = validateBasic();
    if (err) {
      setStatus(err);
      return;
    }

    setBusy(true);
    setStatus("Guardando...");

    try {
      const payload: any = {
        plan,
        planCode: planCodeFromChoice(plan),
        profile: {
          fullName: fullName.trim(),
          dni: onlyDigits(dni),
          cuil: onlyDigits(cuil),
          address: address.trim(),
          phone: onlyDigits(phone),
        },
      };

      if (plan === "company_pro") {
        payload.company = {
          name: companyName.trim(),
          cuit: onlyDigits(companyCuit),
          address: companyAddress.trim(),
          representativeRole: companyRole.trim(),
        };
      }

      const r = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setStatus(j?.error || "No se pudo completar el registro.");
        return;
      }

      setStatus("Listo. Redirigiendo...");
      window.location.href = next;
    } catch {
      setStatus("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  const plans = [PLAN_DEFINITIONS.individual_free, PLAN_DEFINITIONS.individual_pro, PLAN_DEFINITIONS.company_pro];

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <div className="text-sm font-medium">Elegí tu tipo de cuenta</div>
        <p className="mt-1 text-xs text-zinc-600">
          No se realiza ningún cobro en este paso. Podés cambiar tu tipo de cuenta más adelante.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {plans.map((p) => {
            const active = planCodeFromChoice(plan) === p.code;

            return (
              <button
                key={p.code}
                type="button"
                disabled={busy}
                onClick={() => setPlan(p.choice)}
                className={
                  "rounded-xl border p-4 text-left transition " +
                  (active
                    ? "border-black bg-zinc-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{p.label}</div>
                    <div className="mt-1 text-xs text-zinc-600">Hasta {p.defaultMonthlyCreateLimit} documentos/mes</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {p.priceArs === 0 ? formatArs(0) : `${p.pricePrefix ? p.pricePrefix + " " : ""}${formatArs(p.priceArs)}`}
                    </div>
                    {p.listPriceArs ? (
                      <div className="text-xs text-zinc-400 line-through">{formatArs(p.listPriceArs)}</div>
                    ) : (
                      <div className="text-xs text-zinc-400">&nbsp;</div>
                    )}
                  </div>
                </div>

                <ul className="mt-3 space-y-1 text-xs text-zinc-700">
                  {p.highlights.map((h) => (
                    <li key={h}>• {h}</li>
                  ))}
                </ul>

                {active ? <div className="mt-3 text-xs font-medium text-zinc-900">Seleccionado</div> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="text-sm font-medium">Tus datos</div>

        <div className="mt-3 grid gap-3">
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Nombre y apellido (ej: Juan Pérez)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={busy}
            autoComplete="name"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="DNI (solo números)"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              disabled={busy}
              inputMode="numeric"
              autoComplete="off"
            />
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="CUIL/CUIT (solo números)"
              value={cuil}
              onChange={(e) => setCuil(e.target.value)}
              disabled={busy}
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Domicilio (ej: Av. Siempre Viva 123, CABA)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
            autoComplete="street-address"
          />
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Teléfono (solo números)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>
      </div>

      {plan === "company_pro" ? (
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-sm font-medium">Datos de la empresa</div>

          <div className="mt-3 grid gap-3">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Razón social (ej: Ejemplo S.A.)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={busy}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="CUIT empresa (solo números)"
                value={companyCuit}
                onChange={(e) => setCompanyCuit(e.target.value)}
                disabled={busy}
                inputMode="numeric"
              />
              <input
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Rol del representante (ej: Representante legal)"
                value={companyRole}
                onChange={(e) => setCompanyRole(e.target.value)}
                disabled={busy}
              />
            </div>
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Domicilio empresa"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-3">
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Guardando..." : "Completar registro"}
        </button>

        <div className="text-sm text-zinc-600">{status ? <div>{status}</div> : null}</div>
      </div>
    </form>
  );
}
