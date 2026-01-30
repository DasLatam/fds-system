"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DocRow = {
  id: string;
  title: string;
  status: string;
  signing_mode: string;
  total_signers: number | null;
  signed_count: number | null;
  final_path: string | null;
  audit_code: string | null;
  created_at: string | null;
  completed_at: string | null;
};

function fmt(n: number) {
  try {
    return new Intl.NumberFormat("es-AR").format(n);
  } catch {
    return String(n);
  }
}

function daysSince(iso?: string | null) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diff = Date.now() - t;
  return diff / (1000 * 60 * 60 * 24);
}

function isAutoArchived(d: DocRow) {
  if (String(d.status) !== "signed") return false;
  const ds = daysSince(d.completed_at);
  if (ds === null) return false;
  return ds >= 7;
}

const STORAGE_KEY = "fes_archived_docs_v1";

function loadArchived(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function saveArchived(s: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s)));
  } catch {
    // ignore
  }
}

export default function DocumentsListClient({
  docs,
  deleteAction,
}: {
  docs: DocRow[];
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "signed">("all");
  const [mode, setMode] = useState<"all" | "parallel" | "sequential">("all");
  const [showArchived, setShowArchived] = useState(false);

  const [archivedManual, setArchivedManual] = useState<Set<string>>(new Set());

  useEffect(() => {
    setArchivedManual(loadArchived());
  }, []);

  function toggleArchive(id: string) {
    setArchivedManual((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveArchived(next);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (status === "signed" && d.status !== "signed") return false;
        if (status === "pending" && d.status === "signed") return false;

        if (mode !== "all" && String(d.signing_mode) !== mode) return false;

        if (qq) {
          const t = String(d.title || "").toLowerCase();
          const id = String(d.id || "").toLowerCase();
          if (!t.includes(qq) && !id.includes(qq)) return false;
        }

        const auto = isAutoArchived(d);
        const manual = archivedManual.has(d.id);
        const archived = auto || manual;

        return showArchived ? archived : !archived;
      })
      .slice(0, 500);
  }, [docs, q, status, mode, showArchived, archivedManual]);

  const archivedCount = useMemo(() => {
    let c = 0;
    for (const d of docs) {
      const archived = isAutoArchived(d) || archivedManual.has(d.id);
      if (archived) c += 1;
    }
    return c;
  }, [docs, archivedManual]);

  return (
    <div className="rounded-xl border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Tus documentos</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Buscá por título o ID. Podés archivar para ocultar. Los firmados hace 7+ días se ocultan automáticamente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
              title="Mostrar u ocultar archivados"
            >
              {showArchived ? "Ver activos" : `Ver archivados (${fmt(archivedCount)})`}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título o ID..."
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-300 md:max-w-sm"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="signed">Firmados</option>
          </select>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="all">Todos los modos</option>
            <option value="parallel">Paralelo</option>
            <option value="sequential">Secuencial</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-zinc-200">
        {filtered.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-zinc-600">
              {showArchived ? "No tenés documentos archivados." : "No hay documentos para mostrar con esos filtros."}
            </p>
          </div>
        ) : (
          filtered.map((d) => {
            const auto = isAutoArchived(d);
            const manual = archivedManual.has(d.id);

            return (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="mt-1 text-xs text-zinc-600">
                    Estado: <span className="font-medium text-zinc-800">{d.status}</span> · Firma: {d.signing_mode} ·{" "}
                    {d.signed_count ?? 0}/{d.total_signers ?? 0} firmantes
                    {auto ? (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">Auto-archivado</span>
                    ) : null}
                    {manual && !auto ? (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">Archivado</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/doc/${d.id}`} className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm">
                    Ver
                  </Link>

                  {d.status === "signed" && d.final_path ? (
                    <Link
                      prefetch={false}
                      href={`/api/download?documentId=${d.id}&kind=final`}
                      className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Descargar
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => toggleArchive(d.id)}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm"
                    title={auto ? "Auto-archivado por antigüedad" : manual ? "Quitar de archivados" : "Archivar"}
                  >
                    {manual ? "Desarchivar" : "Archivar"}
                  </button>

                  {/* Eliminar: solo si NO está firmado y está “vacío” (sin firmantes ni firmas) */}
                  {d.status !== "signed" && (d.total_signers ?? 0) === 0 && (d.signed_count ?? 0) === 0 ? (
                    <form action={deleteAction}>
                      <input type="hidden" name="documentId" value={d.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:border-red-300 hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}