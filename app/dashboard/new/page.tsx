"use client";

import { useState } from "react";

export default function NewDocumentPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!file) {
      setMsg("Seleccioná un PDF.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title || file.name);
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Error subiendo el PDF.");
        return;
      }

      setMsg("PDF subido. Volvé al dashboard para invitar firmantes.");
      setTitle("");
      setFile(null);
    } catch (err: any) {
      setMsg(err?.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Subir PDF</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Título</label>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contrato alquiler - Enero 2026"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">PDF</label>
          <input
            type="file"
            accept="application/pdf"
            className="block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Subiendo..." : "Subir"}
        </button>

        {msg ? <p className="text-sm text-zinc-700">{msg}</p> : null}
      </form>
    </div>
  );
}
