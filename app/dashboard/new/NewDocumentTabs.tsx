"use client";

import { useMemo, useState } from "react";
import UploadForm from "./UploadForm";
import RedactForm from "./RedactForm";

type Mode = "upload" | "redact";

export default function NewDocumentTabs() {
  const [mode, setMode] = useState<Mode>("upload");

  const tabs = useMemo(
    () =>
      [
        {
          key: "upload" as const,
          label: "Subir PDF",
          desc: "Usá un archivo PDF existente y pedí firmas.",
        },
        {
          key: "redact" as const,
          label: "Redactar",
          desc: "Escribí el documento y generá el PDF automáticamente.",
        },
      ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {tabs.map((t) => {
          const active = mode === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={[
                "rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2",
                active
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50",
              ].join(" ")}
              aria-pressed={active}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">{t.label}</div>
                  <div className="mt-1 text-xs text-zinc-600">{t.desc}</div>
                </div>

                {active ? (
                  <span className="mt-0.5 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Seleccionado
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        {mode === "upload" ? <UploadForm /> : <RedactForm />}
      </div>
    </div>
  );
}
