"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Profile = {
  full_name: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;
};

export default function ProfilePage() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState<Profile>({
    full_name: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/profile");
      const j = await res.json().catch(() => ({}));
      if (!alive) return;
      setEmail(j.email ?? null);
      const p = j.profile;
      setPaused(Boolean(p?.is_paused));
      if (p) {
        setForm({
          full_name: p.full_name ?? "",
          dni: p.dni ?? "",
          cuil: p.cuil ?? "",
          address: p.address ?? "",
          phone: p.phone ?? "",
        });
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isComplete = useMemo(() => {
    return Boolean(form.full_name && form.dni && form.cuil && form.address && form.phone);
  }, [form]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr("No se pudo guardar. Revisá los campos.");
      return;
    }
    setOk("Datos guardados. Ya podés usar la herramienta.");
    if (isComplete) {
      window.location.href = next;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Verificación de identidad</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Para crear o firmar documentos, necesitamos tus datos básicos de identificación. Esto fortalece la trazabilidad y el registro forense.
        </p>

        {paused ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Tu cuenta está pausada. Si creés que es un error, contactá al administrador.
          </div>
        ) : null}

        <div className="mt-4 text-xs text-zinc-500">
          Cuenta: <span className="font-medium text-zinc-700">{email ?? ""}</span>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-zinc-600">Cargando...</p>
        ) : (
          <form onSubmit={save} className="mt-6 grid gap-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre y apellido</label>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">DNI</label>
                <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">CUIL</label>
                <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" value={form.cuil}
                  onChange={(e) => setForm({ ...form, cuil: e.target.value })} required />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Dirección postal</label>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Celular</label>
              <input className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              En una segunda etapa se podrá solicitar foto de DNI y verificación facial.
            </div>

            <button type="submit" className="mt-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
              Guardar y continuar
            </button>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {ok ? <p className="text-sm text-emerald-700">{ok}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
