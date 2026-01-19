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
      setMsg("Seleccioná un PDF antes de subir.");
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

      const id = data?.documentId as string;
      window.location.href = `/dashboard/doc/${id}`;
    } catch (err: any) {
      setMsg(err?.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Subir PDF</h1>
      <p className="mt-2 text-sm text-zinc-600">Subí el documento original. El sistema calculará su hash SHA-256.</p>

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
          {file ? (
            <p className="mt-2 text-xs text-zinc-600">
              Seleccionado: {file.name} ({Math.round(file.size / 1024)} KB)
            </p>
          ) : null}
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
