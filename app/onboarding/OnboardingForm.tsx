"use client";

import { useMemo, useState } from "react";

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

type PlanChoice = "free" | "individual_pro" | "company_pro";

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

  function validateBasic() {
    if (!fullName.trim()) return "Ingresá tu nombre y apellido.";
    if (!dni.trim()) return "Ingresá tu DNI.";
    if (!cuil.trim()) return "Ingresá tu CUIL/CUIT.";
    if (!address.trim()) return "Ingresá tu domicilio.";
    if (!phone.trim()) return "Ingresá tu teléfono.";

    if (plan === "company_pro") {
      if (!companyName.trim()) return "Ingresá la razón social.";
      if (!companyCuit.trim()) return "Ingresá el CUIT de la empresa.";
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
        profile: {
          fullName: fullName.trim(),
          dni: dni.trim(),
          cuil: cuil.trim(),
          address: address.trim(),
          phone: phone.trim(),
        },
      };

      if (plan === "company_pro") {
        payload.company = {
          name: companyName.trim(),
          cuit: companyCuit.trim(),
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

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <div>
        <div className="text-sm font-medium">Tipo de cuenta</div>

        <div className="mt-2 space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="plan"
              value="free"
              checked={plan === "free"}
              onChange={() => setPlan("free")}
              disabled={busy}
            />
            <span>
              <div className="font-medium">Gratuito (Individual)</div>
              <div className="text-xs text-zinc-600">Para uso personal ocasional.</div>
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="plan"
              value="individual_pro"
              checked={plan === "individual_pro"}
              onChange={() => setPlan("individual_pro")}
              disabled={busy}
            />
            <span>
              <div className="font-medium">Personal PRO</div>
              <div className="text-xs text-zinc-600">Más documentos por mes (sin cobro por ahora).</div>
            </span>
          </label>

          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="plan"
              value="company_pro"
              checked={plan === "company_pro"}
              onChange={() => setPlan("company_pro")}
              disabled={busy}
            />
            <span>
              <div className="font-medium">Empresa PRO</div>
              <div className="text-xs text-zinc-600">Cuenta de empresa + representante.</div>
            </span>
          </label>
        </div>

        <div className="mt-2 text-xs text-zinc-500">
          Para más info, después podés ver planes en /pricing (si lo tenés) o lo agregamos.
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-4">
        <div className="text-sm font-medium">Tus datos</div>

        <div className="mt-3 grid gap-3">
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Nombre y apellido"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={busy}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="DNI"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              disabled={busy}
            />
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="CUIL/CUIT"
              value={cuil}
              onChange={(e) => setCuil(e.target.value)}
              disabled={busy}
            />
          </div>
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Domicilio"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
          />
          <input
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
            placeholder="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={busy}
          />
        </div>
      </div>

      {plan === "company_pro" ? (
        <div className="rounded-lg border border-zinc-200 p-4">
          <div className="text-sm font-medium">Datos de la empresa</div>

          <div className="mt-3 grid gap-3">
            <input
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Razón social"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={busy}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="CUIT empresa"
                value={companyCuit}
                onChange={(e) => setCompanyCuit(e.target.value)}
                disabled={busy}
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
