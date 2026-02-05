"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DOCUMENT_TEMPLATES, getTemplateById } from "@/lib/templates/documentTemplates";

export default function RedactForm() {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("blank");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    // Si ya hay contenido escrito, no pisar.
    const currentText = (el.innerText || "").trim();
    if (currentText.length > 0) return;
    el.innerHTML = template.html;
  }, [template]);

  function exec(cmd: string) {
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(cmd);
  }

  async function onCreate() {
    setStatus("");

    const t = title.trim();
    if (!t) {
      setStatus("Ingresá un título.");
      return;
    }

    const html = editorRef.current?.innerHTML || "";
    const plain = (editorRef.current?.innerText || "").trim();
    if (!plain) {
      setStatus("Escribí el contenido del documento.");
      return;
    }

    setBusy(true);
    setStatus("Generando PDF...");

    try {
      const r = await fetch("/api/documents/create-from-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, html, templateId }),
      });

      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        if (j?.code === "PLAN_LIMIT_REACHED") {
          setStatus(j?.error || "Alcanzaste el límite mensual de creación de documentos.");
        } else {
          setStatus(j?.error || "No se pudo crear el documento.");
        }
        return;
      }

      const documentId = j?.documentId;
      if (!documentId) {
        setStatus("No se pudo crear el documento.");
        return;
      }

      window.location.href = `/dashboard/doc/${documentId}`;
    } catch {
      setStatus("Error de red.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <input
          className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          placeholder="Título del documento (ej: Acuerdo de prestación de servicios)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={busy}
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-zinc-600">Plantilla</label>
          <select
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              const el = editorRef.current;
              if (el) el.innerHTML = getTemplateById(e.target.value).html;
            }}
            disabled={busy}
          >
            {DOCUMENT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500">{template.description}</span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50 p-2">
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
            onClick={() => exec("bold")}
            disabled={busy}
          >
            Negrita
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
            onClick={() => exec("italic")}
            disabled={busy}
          >
            Cursiva
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
            onClick={() => exec("underline")}
            disabled={busy}
          >
            Subrayado
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
            onClick={() => exec("insertUnorderedList")}
            disabled={busy}
          >
            Viñetas
          </button>
          <button
            type="button"
            className="rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-50"
            onClick={() => exec("insertOrderedList")}
            disabled={busy}
          >
            Numerada
          </button>
        </div>

        <div
          ref={editorRef}
          className="min-h-[320px] p-4 text-sm leading-6 outline-none"
          contentEditable={!busy}
          suppressContentEditableWarning
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={busy}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Creando..." : "Guardar y continuar"}
        </button>

        {status ? <div className="text-sm text-zinc-600">{status}</div> : null}
      </div>

      <p className="text-xs text-zinc-500">
        Al guardar, se genera un PDF y se crea un documento en tu cuenta activa. Luego podés invitar firmantes desde el detalle del documento.
      </p>
    </div>
  );
}
