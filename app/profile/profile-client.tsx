"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ProfilePayload = {
  full_name: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;
};

export default function ProfileClient() {
  const router = useRouter();
  const search = useSearchParams();
  const nextUrl = useMemo(() => search.get("next") || "/dashboard", [search]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<ProfilePayload>({
    full_name: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/profile", { method: "GET" });
        if (!res.ok) throw new Error("No se pudo cargar el perfil.");
        const data = await res.json();

        if (!cancelled && data?.profile) {
          setForm({
            full_name: data.profile.full_name || "",
            dni: data.profile.dni || "",
            cuil: data.profile.cuil || "",
            address: data.profile.address || "",
            phone: data.profile.phone || "",
          });
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
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-200 bg-white p-6"
    >
      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="grid gap-4">
        <Field
          label="Nombre completo"
          value={form.full_name}
          onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
          required
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="DNI"
            value={form.dni}
            onChange={(v) => setForm((p) => ({ ...p, dni: v }))}
            required
          />
          <Field
            label="CUIL"
            value={form.cuil}
            onChange={(v) => setForm((p) => ({ ...p, cuil: v }))}
            required
          />
        </div>
        <Field
          label="Dirección postal"
          value={form.address}
          onChange={(v) => setForm((p) => ({ ...p, address: v }))}
          required
        />
        <Field
          label="Celular"
          value={form.phone}
          onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          required
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Estos datos se usan para trazabilidad y evidencia de firma.
          </p>
          <button
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}
