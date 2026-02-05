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
        { key: "upload" as const, label: "Subir PDF", desc: "Usá un archivo PDF existente." },
        { key: "redact" as const, label: "Redactar", desc: "Escribí el documento y generá el PDF automáticamente." },
      ],
    []
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = mode === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={
                "rounded-full border px-4 py-2 text-sm font-medium transition " +
                (active ? "border-black bg-zinc-900 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        {mode === "upload" ? (
          <div>
            <div className="font-medium">Subir PDF</div>
            <div className="mt-1">Cargá el archivo y asignale un título. Luego invitás a quienes firman.</div>
          </div>
        ) : (
          <div>
            <div className="font-medium">Redactar</div>
            <div className="mt-1">Escribí el documento, aplicá formato básico y guardá. Se genera un PDF para firma.</div>
          </div>
        )}
      </div>

      {mode === "upload" ? <UploadForm /> : <RedactForm />}
    </div>
  );
}
