import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-zinc-200/60 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-zinc-100 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden>
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700">
                Firma electrónica en Argentina · Evidencia técnica reforzada
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
                Firmá documentos online de forma simple, segura y legal.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-zinc-700">
                Subí un PDF, invitá firmantes y obtené un documento final con sello de integridad (SHA-256), timestamp, IP y auditoría por evento.
                Diseñado para procesos legales y administrativos sin fricción.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white"
                >
                  Empezar gratis
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { k: "0 costo", v: "Firmar siempre es gratis" },
                  { k: "Integridad", v: "Hash SHA-256 + evidencia" },
                  { k: "Auditoría", v: "Eventos: view/open/sign" },
                ].map((x) => (
                  <div key={x.k} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="text-sm font-semibold">{x.k}</div>
                    <div className="mt-1 text-xs text-zinc-600">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Ejemplo de sello</div>
                <div className="text-xs text-zinc-500">Vista previa</div>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4">
                <div className="text-xs text-zinc-600">Documento: Contrato_Alquiler.pdf</div>
                <div className="mt-2 text-xs text-zinc-600">Hash (SHA-256):</div>
                <div className="mt-1 font-mono text-[11px] text-zinc-800">
                  8f3d…c9a1 (ejemplo)
                </div>
                <div className="mt-3 grid gap-2 text-xs text-zinc-600">
                  <div>
                    Timestamp: <span className="text-zinc-800">2026-01-19 00:00:00 UTC-3</span>
                  </div>
                  <div>
                    IP firmante: <span className="text-zinc-800">190.10.20.30</span>
                  </div>
                  <div>
                    Estado: <span className="text-emerald-700">Firmado</span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-zinc-600">
                * Firma electrónica conforme a Ley 25.506 (art. 5). Incluye consentimiento y trazabilidad. No reemplaza firma digital certificada.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Cómo funciona</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "1. Subís el PDF", d: "Storage privado con control de acceso." },
              { t: "2. Invitás firmantes", d: "Links únicos + rate limiting." },
              { t: "3. Firman", d: "Firma manuscrita + datos identificatorios." },
              { t: "4. Cerrás", d: "PDF final sellado + auditoría." },
            ].map((x) => (
              <div key={x.t} className="rounded-xl border border-zinc-200 bg-white p-5">
                <div className="text-sm font-semibold">{x.t}</div>
                <div className="mt-2 text-sm text-zinc-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
