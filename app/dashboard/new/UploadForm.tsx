"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UploadForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const tOk = title.trim().length >= 3;
    return tOk && Boolean(file);
  }, [title, file]);

  async function submit() {
    setErr(null);
    if (!file) {
      setErr("Seleccioná un PDF.");
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("file", file);

      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || "No se pudo crear el documento.");

      router.refresh();
      router.push(`/dashboard/doc/${data.documentId}`);
    } catch (e: any) {
      setErr(e?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-zinc-900">Subir PDF</div>
        <p className="mt-1 text-xs text-zinc-600">
          Subí el documento y luego invitá firmantes por link. Recomendado si ya tenés el PDF final.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Título del documento</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Contrato de alquiler"
            disabled={busy}
            autoComplete="off"
          />
          <p className="text-xs text-zinc-500">Se usará en emails y en el registro de auditoría.</p>
        </div>

        <div className="space-y-2">
          <Label>Archivo PDF</Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={busy}
          />
          <p className="text-xs text-zinc-500">Formato: PDF. Si el archivo es escaneado, la firma igualmente queda registrada.</p>
        </div>

        {err ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div> : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={submit} disabled={!canSubmit || busy}>
            {busy ? "Creando..." : "Crear documento"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTitle("");
              setFile(null);
              setErr(null);
            }}
            disabled={busy}
          >
            Limpiar
          </Button>
        </div>
      </div>
    </div>
  );
}
