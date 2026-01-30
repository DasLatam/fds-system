import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-zinc-200">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-medium text-zinc-600">Firma electrónica en Argentina</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Firmá PDFs online, simple y robusto.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              Invitá firmantes por email, capturá firma manuscrita y generá un PDF final con evidencia técnica
              (hash SHA-256, IP y timestamp). Pensado para contratos, autorizaciones y documentación diaria.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Empezar gratis
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium"
              >
                Ver planes
              </Link>
              <Link href="#como-funciona" className="text-sm text-zinc-700 hover:text-zinc-900">
                Cómo funciona
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">Gratis para firmar</div>
                <div className="mt-1">Firmantes sin costo, con historial.</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">Evidencia técnica</div>
                <div className="mt-1">Hash + auditoría + timestamps.</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">Bucket privado</div>
                <div className="mt-1">Archivos protegidos por defecto.</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100" />
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-white text-2xl">
                  ✍️
                </div>
                <div>
                  <div className="text-sm font-medium">Firma Electrónica Simple</div>
                  <div className="text-xs text-zinc-600">Evidencia, trazabilidad y control.</div>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="text-xs text-zinc-500">Documento</div>
                  <div className="mt-1 font-medium">Contrato de alquiler</div>
                  <div className="mt-2 text-xs text-zinc-600">
                    Hash SHA-256: <span className="font-mono">a3f1…9c2b</span>
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="text-xs text-zinc-500">Firmantes</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span>ariel@…</span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">Pendiente</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>cliente@…</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">Firmado</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="text-xs text-zinc-500">Auditoría</div>
                  <div className="mt-2 text-xs text-zinc-600">
                    view/open/sign/email-sent con IP, user-agent y timestamp.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Cómo funciona</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { t: "Subí el PDF", d: "Guardado en bucket privado." },
            { t: "Invitá firmantes", d: "Links únicos por email." },
            { t: "Firman online", d: "Firma manuscrita + consentimiento." },
            { t: "Descargá el final", d: "PDF con evidencia y auditoría." },
          ].map((s) => (
            <div key={s.t} className="rounded-xl border border-zinc-200 p-4">
              <div className="font-medium">{s.t}</div>
              <div className="mt-1 text-sm text-zinc-600">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Legal y seguridad</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="font-medium">Cumplimiento</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Implementamos firma electrónica conforme a la Ley 25.506. Generamos evidencia técnica para respaldar
                integridad y trazabilidad del documento (hash SHA-256, timestamps, auditoría de eventos).
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="font-medium">Protección de datos</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                PDFs en bucket privado, acceso por URLs firmadas temporales y registros de auditoría. Retención de evidencia
                hasta 10 años para fines de seguridad y cumplimiento, con acceso restringido.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
              Probar gratis
            </Link>
            <Link href="/terms" className="text-sm text-zinc-700 hover:text-zinc-900">
              Leer términos
            </Link>
            <Link href="/privacy" className="text-sm text-zinc-700 hover:text-zinc-900">
              Ver privacidad
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
