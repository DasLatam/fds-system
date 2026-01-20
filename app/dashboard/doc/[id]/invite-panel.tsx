"use client";

import { useMemo, useState } from "react";

type SignerInput = {
  email: string;
};

export default function InvitePanel({
  documentId,
  currentMode,
  currentUserEmail,
}: {
  documentId: string;
  currentMode: "parallel" | "sequential";
  currentUserEmail: string;
}) {
  const [mode, setMode] = useState<"parallel" | "sequential">(currentMode);
  const [expiresInDays, setExpiresInDays] = useState(3);
  const [includeMe, setIncludeMe] = useState(true);
  const [signers, setSigners] = useState<SignerInput[]>([{ email: "" }]);
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
    setSigners(prev => [...prev, { email: "" }]);
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
          expiresInDays,
          signers: [
            ...(includeMe ? [{ email: currentUserEmail }] : []),
            ...signers,
          ].filter((s) => s.email.trim().includes("@")),
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
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(Number(e.target.value))}
            className="rounded-md border border-zinc-200 px-2 py-1 text-sm"
            title="Vencimiento"
          >
            <option value={3}>Vence en 3 días</option>
            <option value={5}>5 días</option>
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
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
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={includeMe} onChange={(e) => setIncludeMe(e.target.checked)} />
          <span>Incluirme como firmante (<b>{currentUserEmail}</b>)</span>
        </label>
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
              <div className="text-xs text-zinc-600 md:col-span-2">
                Los datos del firmante (nombre, DNI, CUIL, domicilio y celular) se pedirán al momento de firmar.
              </div>
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
