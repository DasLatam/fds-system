"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PlanChoice = "free" | "individual_pro" | "company_pro";

type ProfilePayload = {
  full_name: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;
  // legacy fields (ya existentes)
  plan?: string | null;
  default_account_id?: string | null;
};

type CompanyPayload = {
  name: string;
  cuit: string;
  address: string;
  representativeRole: string;
};

function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}

function mapPlanChoiceFromServer(activePlanCode?: string | null, legacyPlan?: string | null): PlanChoice | null {
  const pc = String(activePlanCode || "").trim();
  if (pc === "company_pro") return "company_pro";
  if (pc === "individual_pro") return "individual_pro";
  if (pc === "individual_free") return "free";

  // Fallback legacy: profiles.plan es "free" | "pro".
  const lp = String(legacyPlan || "").trim();
  if (lp === "free") return "free";
  if (lp === "pro") return "individual_pro"; // mejor esfuerzo
  return null;
}

export default function ProfileClient() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = useMemo(() => search.get("next") || "/dashboard", [search]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [step, setStep] = useState<"plan" | "form">("plan");
  const [plan, setPlan] = useState<PlanChoice | null>(null);

  const [form, setForm] = useState<ProfilePayload>({
    full_name: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  });

  const [company, setCompany] = useState<CompanyPayload>({
    name: "",
    cuit: "",
    address: "",
    representativeRole: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/profile", { method: "GET" });
        if (!res.ok) throw new Error("No se pudo cargar el perfil.");
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        const p = (data?.profile || null) as ProfilePayload | null;
        if (p) {
          setForm({
            full_name: p.full_name || "",
            dni: p.dni || "",
            cuil: p.cuil || "",
            address: p.address || "",
            phone: p.phone || "",
            plan: (p as any).plan ?? null,
            default_account_id: (p as any).default_account_id ?? null,
          });
        }

        const inferred = mapPlanChoiceFromServer(data?.activePlanCode ?? null, (p as any)?.plan ?? null);
        if (inferred) {
          setPlan(inferred);
          setStep("form");
        } else {
          setStep("plan");
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Error cargando perfil.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!plan) {
      setErr("Seleccioná un plan antes de completar tus datos.");
      setStep("plan");
      return;
    }

    const profile = {
      fullName: form.full_name.trim(),
      dni: onlyDigits(form.dni),
      cuil: onlyDigits(form.cuil),
      address: form.address.trim(),
      phone: onlyDigits(form.phone),
    };

    if (profile.fullName.length < 2) {
      setErr("Nombre completo inválido.");
      return;
    }
    if (profile.dni.length < 6) {
      setErr("DNI inválido.");
      return;
    }
    if (profile.cuil.length !== 11) {
      setErr("CUIL inválido: debe tener 11 dígitos (sin guiones).");
      return;
    }
    if (profile.address.length < 5) {
      setErr("Dirección inválida.");
      return;
    }
    if (profile.phone.length < 6) {
      setErr("Celular inválido.");
      return;
    }

    const body: any = {
      plan,
      profile,
    };

    if (plan === "company_pro") {
      const c = {
        name: company.name.trim(),
        cuit: onlyDigits(company.cuit),
        address: company.address.trim(),
        representativeRole: company.representativeRole.trim(),
      };

      if (c.name.length < 2) {
        setErr("Completá la razón social de la empresa.");
        return;
      }
      if (c.cuit.length !== 11) {
        setErr("CUIT inválido: debe tener 11 dígitos (sin guiones).");
        return;
      }
      if (c.address.length < 5) {
        setErr("Completá el domicilio de la empresa.");
        return;
      }
      if (c.representativeRole.length < 2) {
        setErr("Completá tu rol/cargo dentro de la empresa.");
        return;
      }

      body.company = c;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el perfil.");

      router.replace(nextUrl);
    } catch (e: any) {
      setErr(e?.message || "Error guardando perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Cargando…
      </div>
    );
  }

  if (step === "plan") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        {err ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}

        <h2 className="text-base font-semibold">Elegí tu plan</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Esto define qué datos te vamos a pedir. Todavía no hay cobro: solo marcamos el tipo de cuenta para configurar tu panel.
        </p>

        <div className="mt-4 grid gap-3">
          <PlanCard
            title="Gratuito"
            subtitle="Firmar y recibir documentos"
            selected={plan === "free"}
            onClick={() => setPlan("free")}
          />
          <PlanCard
            title="Personal PRO"
            subtitle="Más límite mensual y funciones avanzadas"
            selected={plan === "individual_pro"}
            onClick={() => setPlan("individual_pro")}
          />
          <PlanCard
            title="Empresa PRO"
            subtitle="Cuenta empresa + gestión multiusuario (owner)"
            selected={plan === "company_pro"}
            onClick={() => setPlan("company_pro")}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Podés cambiarlo más adelante.</p>
          <button
            type="button"
            onClick={() => {
              if (!plan) {
                setErr("Seleccioná un plan para continuar.");
                return;
              }
              setErr(null);
              setStep("form");
            }}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-zinc-200 bg-white p-6">
      {err ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <div className="text-sm text-zinc-800">
          Plan seleccionado: <span className="font-medium">{plan === "company_pro" ? "Empresa PRO" : plan === "individual_pro" ? "Personal PRO" : "Gratuito"}</span>
        </div>
        <button
          type="button"
          onClick={() => setStep("plan")}
          className="text-sm underline text-zinc-700"
          disabled={saving}
        >
          Cambiar
        </button>
      </div>

      <div className="grid gap-4">
        <Field
          label="Nombre completo"
          placeholder="Ej: Ariel Baudry"
          value={form.full_name}
          onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
          required
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="DNI"
            placeholder="Ej: 24589462"
            inputMode="numeric"
            value={form.dni}
            onChange={(v) => setForm((p) => ({ ...p, dni: onlyDigits(v) }))}
            required
          />
          <Field
            label="CUIL"
            placeholder="Ej: 20245894628 (sin guiones)"
            inputMode="numeric"
            value={form.cuil}
            onChange={(v) => setForm((p) => ({ ...p, cuil: onlyDigits(v) }))}
            required
          />
        </div>

        <Field
          label="Dirección postal"
          placeholder="Ej: Calle 129 7304, Quilmes, Buenos Aires"
          value={form.address}
          onChange={(v) => setForm((p) => ({ ...p, address: v }))}
          required
        />

        <Field
          label="Celular"
          placeholder="Ej: 1139009550 (solo números)"
          inputMode="tel"
          value={form.phone}
          onChange={(v) => setForm((p) => ({ ...p, phone: onlyDigits(v) }))}
          required
        />

        {plan === "company_pro" ? (
          <div className="mt-2 rounded-xl border border-zinc-200 p-4">
            <div className="text-sm font-semibold">Datos de la empresa</div>
            <p className="mt-1 text-xs text-zinc-600">
              Se usan para crear/seleccionar tu cuenta empresa y setear la cuenta activa.
            </p>

            <div className="mt-4 grid gap-3">
              <Field
                label="Razón social"
                placeholder="Ej: Empresa S.A."
                value={company.name}
                onChange={(v) => setCompany((p) => ({ ...p, name: v }))}
                required
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field
                  label="CUIT"
                  placeholder="Ej: 30712345678 (sin guiones)"
                  inputMode="numeric"
                  value={company.cuit}
                  onChange={(v) => setCompany((p) => ({ ...p, cuit: onlyDigits(v) }))}
                  required
                />
                <Field
                  label="Rol / cargo del representante"
                  placeholder="Ej: Apoderado / Director"
                  value={company.representativeRole}
                  onChange={(v) => setCompany((p) => ({ ...p, representativeRole: v }))}
                  required
                />
              </div>

              <Field
                label="Domicilio de la empresa"
                placeholder="Ej: Calle 123, Localidad, Provincia"
                value={company.address}
                onChange={(v) => setCompany((p) => ({ ...p, address: v }))}
                required
              />
            </div>
          </div>
        ) : null}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Estos datos se usan para trazabilidad y evidencia de firma.</p>
          <button disabled={saving} className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PlanCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full rounded-xl border p-4 text-left transition " +
        (selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-xs text-zinc-600">{subtitle}</div>
        </div>
        <div
          className={
            "mt-1 h-4 w-4 rounded-full border " +
            (selected ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-white")
          }
          aria-hidden
        />
      </div>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
      />
    </label>
  );
}
