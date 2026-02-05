'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'upload' | 'redact';

export default function UploadForm() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('upload');

  // shared
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // upload
  const [file, setFile] = useState<File | null>(null);

  // redact
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorTick, setEditorTick] = useState(0);

  function bumpEditor() {
    setEditorTick((t) => t + 1);
  }

  const canSubmit = useMemo(() => {
    const tOk = title.trim().length >= 3;
    if (!tOk) return false;
    if (mode === 'upload') return Boolean(file);
    const html = editorRef.current?.innerHTML || '';
    const text = (editorRef.current?.innerText || '').trim();
    return Boolean(html && text.length > 1);
  }, [title, mode, file, editorTick]);

  function exec(cmd: string, value?: string) {
    try {
      // Prefer spans with style instead of <font>
      // @ts-ignore (deprecated API, pero soportado en browsers)
      document.execCommand('styleWithCSS', false, 'true');
      // @ts-ignore
      document.execCommand(cmd, false, value);
    } catch {
      // ignore
    } finally {
      editorRef.current?.focus();
      bumpEditor();
    }
  }

  function setFontSizePx(px: number) {
    // execCommand only supports 1-7. We'll map to 1-7 and then normalize to inline styles.
    const map: Record<number, string> = {
      12: '3',
      14: '3',
      16: '4',
      18: '4',
      24: '5',
      32: '6',
    };

    const size = map[px] || '3';
    // @ts-ignore
    document.execCommand('styleWithCSS', false, 'true');
    // @ts-ignore
    document.execCommand('fontSize', false, size);

    // Normalize <font size="x"> into <span style="font-size:..px">
    const root = editorRef.current;
    if (!root) return;
    const fonts = root.querySelectorAll('font[size]');
    fonts.forEach((f) => {
      const sz = f.getAttribute('size') || '';
      let px2 = px;
      if (sz === '1') px2 = 10;
      if (sz === '2') px2 = 12;
      if (sz === '3') px2 = 14;
      if (sz === '4') px2 = 16;
      if (sz === '5') px2 = 18;
      if (sz === '6') px2 = 24;
      if (sz === '7') px2 = 32;

      const span = document.createElement('span');
      span.style.fontSize = `${px2}px`;
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });

    bumpEditor();
  }

  async function submitUpload() {
    setErr(null);
    if (!file) {
      setErr('Seleccioná un PDF.');
      return;
    }

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('file', file);

      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo crear el documento.');
      }

      router.refresh();
      router.push(`/dashboard/doc/${data.documentId}`);
    } catch (e: any) {
      setErr(e?.message || 'Error inesperado.');
    } finally {
      setBusy(false);
    }
  }

  async function submitRedact() {
    setErr(null);

    const html = editorRef.current?.innerHTML || '';
    const text = (editorRef.current?.innerText || '').trim();
    if (!text || text.length < 2) {
      setErr('Escribí el contenido del documento.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/documents/create-from-text', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          html,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo crear el documento.');
      }

      router.refresh();
      router.push(`/dashboard/doc/${data.documentId}`);
    } catch (e: any) {
      setErr(e?.message || 'Error inesperado.');
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (mode === 'upload') return submitUpload();
    return submitRedact();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear documento</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'outline'}
            onClick={() => setMode('upload')}
          >
            Subir PDF
          </Button>
          <Button
            type="button"
            variant={mode === 'redact' ? 'default' : 'outline'}
            onClick={() => setMode('redact')}
          >
            Redactar
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Contrato de prestación de servicios"
          />
          <p className="text-xs text-muted-foreground">Mínimo 3 caracteres.</p>
        </div>

        {mode === 'upload' ? (
          <div className="space-y-2">
            <Label htmlFor="file">Archivo (PDF)</Label>
            <Input
              id="file"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Se guardará como PDF original y luego podrás invitar firmantes.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Contenido</Label>

            <div className="flex flex-wrap gap-2 rounded-md border p-2">
              <Button type="button" variant="outline" onClick={() => exec('undo')}>
                Deshacer
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('redo')}>
                Rehacer
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('bold')}>
                Negrita
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('italic')}>
                Cursiva
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('underline')}>
                Subrayado
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('strikeThrough')}>
                Tachado
              </Button>

              <Button type="button" variant="outline" onClick={() => exec('insertUnorderedList')}>
                Viñetas
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('insertOrderedList')}>
                Numeración
              </Button>

              <Button type="button" variant="outline" onClick={() => exec('justifyLeft')}>
                Izq.
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('justifyCenter')}>
                Centro
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('justifyRight')}>
                Der.
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('justifyFull')}>
                Justificar
              </Button>

              <Button type="button" variant="outline" onClick={() => exec('outdent')}>
                - Sangría
              </Button>
              <Button type="button" variant="outline" onClick={() => exec('indent')}>
                + Sangría
              </Button>

              <Button type="button" variant="outline" onClick={() => exec('removeFormat')}>
                Limpiar formato
              </Button>

              <div className="flex items-center gap-2">
                <Label className="text-xs">Fuente</Label>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  onChange={(e) => exec('fontName', e.target.value)}
                  defaultValue="Helvetica"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs">Tamaño</Label>
                <select
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  onChange={(e) => setFontSizePx(Number(e.target.value))}
                  defaultValue="16"
                >
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="24">24</option>
                  <option value="32">32</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs">Color</Label>
                <input
                  type="color"
                  className="h-9 w-10 rounded-md border bg-background"
                  onChange={(e) => exec('foreColor', e.target.value)}
                  title="Color de texto"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs">Resaltar</Label>
                <input
                  type="color"
                  className="h-9 w-10 rounded-md border bg-background"
                  onChange={(e) => exec('hiliteColor', e.target.value)}
                  title="Color de resaltado"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const url = prompt('Pegá el enlace (URL):') || '';
                  if (!url.trim()) return;
                  exec('createLink', url.trim());
                }}
              >
                Enlace
              </Button>
            </div>

            <div
              ref={editorRef}
              className="min-h-[320px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none"
              contentEditable
              suppressContentEditableWarning
              onInput={() => bumpEditor()}
              onKeyUp={() => bumpEditor()}
              onPaste={() => setTimeout(() => bumpEditor(), 0)}
              data-placeholder="Escribí aquí el contenido del documento..."
            />

            <p className="text-xs text-muted-foreground">
              Nota: por ahora, el PDF se genera en formato texto (v1). El contenido y saltos de línea se respetan.
            </p>
          </div>
        )}

        {err ? <p className="text-sm text-red-600">{err}</p> : null}

        <Button disabled={!canSubmit || busy} onClick={submit}>
          {busy ? 'Procesando…' : 'Crear documento'}
        </Button>
      </CardContent>
    </Card>
  );
}
