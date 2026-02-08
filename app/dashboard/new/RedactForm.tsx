"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENT_TEMPLATES, type DocumentTemplateId } from "@/lib/templates/documentTemplates";

type Props = {
  onCreated?: (documentId: string) => void;
};

type HeadingValue = "p" | "h1" | "h2" | "h3";

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  blockquote: boolean;
  link: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
};

function safeQueryState(cmd: string) {
  try {
    return Boolean(document.queryCommandState(cmd));
  } catch {
    return false;
  }
}

function safeQueryValue(cmd: string) {
  try {
    return String(document.queryCommandValue(cmd) ?? "");
  } catch {
    return "";
  }
}

function ToolbarButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active ? "true" : "false"}
      onMouseDown={(e) => e.preventDefault()} // evita perder la selección
      onClick={onClick}
      className={
        "inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 " +
        (active
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50")
      }
    >
      {children}
    </button>
  );
}

export function RedactForm({ onCreated }: Props) {
  const templates = useMemo(() => DOCUMENT_TEMPLATES, []);
  const [templateId, setTemplateId] = useState<DocumentTemplateId>("servicios-profesionales");
  const template = templates.find((t) => t.id === templateId) || templates[0];

  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(template.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    orderedList: false,
    unorderedList: false,
    blockquote: false,
    link: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false,
  });
  const [heading, setHeading] = useState<HeadingValue>("p");

  const placeholder = "Escribí el contenido del documento…";

  function focusEditor() {
    editorRef.current?.focus();
  }

  function exec(command: string, value?: string) {
    focusEditor();
    try {
      document.execCommand(command, false, value);
    } catch {
      // no-op
    }
    refreshFormat();
  }

  function refreshFormat() {
    setFormat({
      bold: safeQueryState("bold"),
      italic: safeQueryState("italic"),
      underline: safeQueryState("underline"),
      strikeThrough: safeQueryState("strikeThrough"),
      orderedList: safeQueryState("insertOrderedList"),
      unorderedList: safeQueryState("insertUnorderedList"),
      blockquote: safeQueryState("formatBlock") && safeQueryValue("formatBlock").toLowerCase().includes("blockquote"),
      link: safeQueryState("createLink"),
      justifyLeft: safeQueryState("justifyLeft"),
      justifyCenter: safeQueryState("justifyCenter"),
      justifyRight: safeQueryState("justifyRight"),
    });

    const fb = safeQueryValue("formatBlock").replaceAll("<", "").replaceAll(">", "").toLowerCase();
    if (fb === "h1" || fb === "h2" || fb === "h3") setHeading(fb as HeadingValue);
    else setHeading("p");
  }

  function setHeadingBlock(v: HeadingValue) {
    if (v === "p") exec("formatBlock", "P");
    else exec("formatBlock", v.toUpperCase());
    setHeading(v);
  }

  function insertLink() {
    focusEditor();
    const existing = safeQueryValue("createLink");
    const url = window.prompt(
      "Pegá la URL del enlace:",
      existing && typeof existing === "string" ? existing : "https://"
    );
    if (!url) return;
    exec("createLink", url);
  }

  function removeLink() {
    exec("unlink");
  }

  function clearFormatting() {
    exec("removeFormat");
    exec("unlink");
  }

  function getHtml() {
    const html = editorRef.current?.innerHTML || "";
    // Normalización suave para evitar basura común.
    return html.replaceAll("\u200B", "").replaceAll("\uFEFF", "").replaceAll("&nbsp;", " ").trim();
  }

  function getPlainText() {
    const txt = editorRef.current?.innerText || "";
    return txt.replaceAll("\u200B", "").replaceAll("\uFEFF", "").trim();
  }

  function setEditorHtml(html: string) {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = html;
    // ubicamos el cursor al final
    try {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {}
    refreshFormat();
  }

  useEffect(() => {
    // Inicializar con template.
    if (editorRef.current) {
      setEditorHtml(template.html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTitle(template.title);
    // Si el editor está vacío, reemplazamos por el template seleccionado.
    if (getPlainText().length === 0) {
      setEditorHtml(template.html);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => {
    const onSelectionChange = () => {
      // solo refrescamos si el foco está dentro del editor
      const el = editorRef.current;
      if (!el) return;
      const active = document.activeElement;
      if (active === el || el.contains(active)) refreshFormat();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = getPlainText().length === 0;

  async function onDownloadDraft() {
    setError(null);
    try {
      const html = getHtml();
      const r = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || template.title, html }),
      });
      if (!r.ok) throw new Error("No se pudo generar el borrador.");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        (title.trim() || template.title).replaceAll(/[^a-z0-9\-_ ]/gi, "").slice(0, 64) || "documento"
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || "Error al descargar borrador.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    const html = getHtml();
    const plain = getPlainText();

    if (!t) {
      setError("Ingresá un título.");
      return;
    }

    if (!plain) {
      setError("Escribí el contenido del documento.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/documents/create-from-text", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: t, html, templateId }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || "No se pudo crear el documento.");

      // compat: algunas versiones devuelven {documentId}, otras {id}
      const id = String(j?.documentId || j?.id || "");
      if (!id) throw new Error("Respuesta inválida: falta id.");

      onCreated?.(id);
    } catch (e: any) {
      setError(e?.message || "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Plantilla</Label>
          <select
            className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value as DocumentTemplateId)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-zinc-500">Podés partir de una plantilla y luego editarla a tu gusto.</p>
        </div>
        <div>
          <Label>Título</Label>
          <Input
            className="mt-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contrato de servicios"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-700">Formato</span>
            <select
              className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              value={heading}
              onChange={(e) => setHeadingBlock(e.target.value as HeadingValue)}
              title="Encabezado"
            >
              <option value="p">Párrafo</option>
              <option value="h1">Título</option>
              <option value="h2">Subtítulo</option>
              <option value="h3">Encabezado</option>
            </select>
          </div>

          <div className="h-6 w-px bg-zinc-200" />

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton title="Negrita" active={format.bold} onClick={() => exec("bold")}>
              B
            </ToolbarButton>
            <ToolbarButton title="Cursiva" active={format.italic} onClick={() => exec("italic")}>
              I
            </ToolbarButton>
            <ToolbarButton title="Subrayado" active={format.underline} onClick={() => exec("underline")}>
              U
            </ToolbarButton>
            <ToolbarButton title="Tachado" active={format.strikeThrough} onClick={() => exec("strikeThrough")}>
              S
            </ToolbarButton>
          </div>

          <div className="h-6 w-px bg-zinc-200" />

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton
              title="Lista con viñetas"
              active={format.unorderedList}
              onClick={() => exec("insertUnorderedList")}
            >
              • Lista
            </ToolbarButton>
            <ToolbarButton
              title="Lista numerada"
              active={format.orderedList}
              onClick={() => exec("insertOrderedList")}
            >
              1. Lista
            </ToolbarButton>
            <ToolbarButton title="Cita" active={format.blockquote} onClick={() => exec("formatBlock", "BLOCKQUOTE")}>
              ❝
            </ToolbarButton>
            <ToolbarButton title="Regla horizontal" onClick={() => exec("insertHorizontalRule")}>
              ―
            </ToolbarButton>
          </div>

          <div className="h-6 w-px bg-zinc-200" />

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton title="Alinear a la izquierda" active={format.justifyLeft} onClick={() => exec("justifyLeft")}>
              ⟸
            </ToolbarButton>
            <ToolbarButton title="Centrar" active={format.justifyCenter} onClick={() => exec("justifyCenter")}>
              ≡
            </ToolbarButton>
            <ToolbarButton title="Alinear a la derecha" active={format.justifyRight} onClick={() => exec("justifyRight")}>
              ⟹
            </ToolbarButton>
          </div>

          <div className="h-6 w-px bg-zinc-200" />

          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton title="Insertar enlace" active={format.link} onClick={insertLink}>
              🔗
            </ToolbarButton>
            <ToolbarButton title="Quitar enlace" onClick={removeLink}>
              ⨯
            </ToolbarButton>
            <ToolbarButton title="Limpiar formato" onClick={clearFormatting}>
              Tx
            </ToolbarButton>
            <ToolbarButton title="Deshacer" onClick={() => exec("undo")}>
              ↶
            </ToolbarButton>
            <ToolbarButton title="Rehacer" onClick={() => exec("redo")}>
              ↷
            </ToolbarButton>
          </div>
        </div>

        <div className="relative">
          {isEmpty ? (
            <div className="pointer-events-none absolute left-4 top-4 text-sm text-zinc-400">{placeholder}</div>
          ) : null}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={refreshFormat}
            onFocus={refreshFormat}
            className="min-h-[320px] rounded-b-2xl px-4 py-4 text-sm leading-relaxed text-zinc-900 outline-none selection:bg-emerald-100"
          />
        </div>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDownloadDraft} disabled={busy}>
            Descargar borrador
          </Button>
        </div>

        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Creando…" : "Guardar y continuar"}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        Consejo: si necesitás una firma más formal, revisá los términos del documento y validá la identidad del firmante por tu proceso interno.
      </p>
    </form>
  );
}

// ✅ Esto arregla el build: permite `import RedactForm from "./RedactForm"`
export default RedactForm;
