"use client";

import { useRef, useState } from "react";

export default function UploadForm() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("Ningún archivo seleccionado");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  function openPicker() {
    // ✅ siempre desde un gesto del usuario (click real)
    fileRef.current?.click();
  }

  function onFileChange() {
    const f = fileRef.current?.files?.[0];
    setFileName(f ? f.name : "Ningún archivo seleccionado");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    const f = fileRef.current?.files?.[0];
    if (!title.trim()) {
      setStatus("Ingresá un título.");
      return;
    }
    if (!f) {
      setStatus("Seleccioná un PDF.");
      return;
    }
    if (f.type !== "application/pdf") {
      setStatus("El archivo debe ser un PDF.");
      return;
    }

    setBusy(true);
    setStatus("Subiendo...");

    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("file", f);

      const r = await fetch("/api/documents/upload", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        setStatus(j?.error || "No se pudo subir el PDF.");
        return;
      }

      setStatus("Listo. Redirigiendo...");
      if (j?.documentId) window.location.href = "/dashboard/doc/" + j.documentId;
      else window.location.href = "/dashboard";
    } catch {
      setStatus("Error de red al subir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium">Título del documento</label>
        <input
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Constancia ARCA"
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          disabled={busy}
        />
        <p className="mt-1 text-xs text-zinc-500">Este título se mostrará en el dashboard y en la página de firma.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Archivo PDF</label>

        {/* ✅ input real oculto */}
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChange}
          disabled={busy}
        />

        {/* ✅ botón visible */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openPicker}
            className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
            disabled={busy}
          >
            Elegir PDF…
          </button>
          <span className="text-sm text-zinc-600">{fileName}</span>
        </div>

        <p className="mt-1 text-xs text-zinc-500">Solo PDF. Tamaño recomendado: hasta 10–20 MB.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={busy}
        >
          {busy ? "Subiendo..." : "Subir y crear documento"}
        </button>
        <span className="text-sm text-zinc-600">{status}</span>
      </div>
    </form>
  );
}