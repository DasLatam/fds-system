"use client";

import { useMemo, useState } from "react";

type SignerInput = {
  email: string;
  fullName: string;
  dni: string;
  cuil: string;
  address: string;
  phone: string;
};

export default function InvitePanel({ documentId, currentMode }: { documentId: string; currentMode: "parallel" | "sequential" }) {
  const [mode, setMode] = useState<"parallel" | "sequential">(currentMode);
  const [signers, setSigners] = useState<SignerInput[]>([{
    email: "",
    fullName: "",
    dni: "",
    cuil: "",
    address: "",
    phone: "",
  }]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canSend = useMemo(() => {
    return signers.every(s => s.email.trim().includes("@")) && signers.length > 0;
  }, [signers]);

  function update(i: number, field: keyof SignerInput, value: string) {
    setSigners(prev => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  }

  function addRow() {
    setSigners(prev => [...prev, { email: "", fullName: "", dni: "", cuil: "", address: "", phone: "" }]);
  }

  function removeRow(i: number) {
    setSigners(prev => prev.filter((_, idx) => idx !== i));
  }

  async function sendInvites() {
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId,
          signingMode: mode,
          signers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Error enviando invitaciones.");
        return;
      }
      setMsg(`Invitaciones enviadas: ${data.invited ?? data.sent ?? 0}`);
      // refresh
      window.location.reload();
    } catch (e: any) {
      setMsg(e?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium">Invitar firmantes</div>
          <div className="text-sm text-zinc-600">Modo: paralelo o secuencial (con orden).</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="rounded-md border border-zinc-200 px-2 py-1 text-sm"
          >
            <option value="parallel">Paralelo</option>
            <option value="sequential">Secuencial</option>
          </select>
          <button
            onClick={sendInvites}
            disabled={!canSend || busy}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {signers.map((s, i) => (
          <div key={i} className="rounded-lg border border-zinc-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Firmante {i + 1}{mode === "sequential" ? ` (orden ${i + 1})` : ""}</div>
              {signers.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-zinc-600 hover:text-zinc-900"
                  onClick={() => removeRow(i)}
                >
                  Quitar
                </button>
              ) : null}
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Email"
                value={s.email}
                onChange={(e) => update(i, "email", e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Nombre completo"
                value={s.fullName}
                onChange={(e) => update(i, "fullName", e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="DNI"
                value={s.dni}
                onChange={(e) => update(i, "dni", e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="CUIL"
                value={s.cuil}
                onChange={(e) => update(i, "cuil", e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm md:col-span-2"
                placeholder="Dirección postal"
                value={s.address}
                onChange={(e) => update(i, "address", e.target.value)}
              />
              <input
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Celular"
                value={s.phone}
                onChange={(e) => update(i, "phone", e.target.value)}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
            onClick={addRow}
          >
            + Agregar firmante
          </button>
          {msg ? <div className="text-sm text-zinc-700">{msg}</div> : null}
        </div>
      </div>
    </div>
  );
}
