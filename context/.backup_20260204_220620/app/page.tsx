import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-zinc-200">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-medium text-zinc-600">Firma electrónica en Argentina</p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Firmá documentos online de forma simple y legal.
            </h1>

            <p className="mt-4 text-base leading-relaxed text-zinc-600">
              Firma Electrónica Simple conforme a la Ley 25.506 (Argentina). Invitá firmantes por email, capturá firma
              manuscrita y generá un PDF final verificable con evidencia técnica (hash SHA-256, IP y timestamp).
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Crear una firma
              </Link>

              <Link href="#como-funciona" className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium">
                Ver cómo funciona
              </Link>

              <Link href="/pricing" className="text-sm text-zinc-700 hover:text-zinc-900">
                Ver planes
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">Firmantes sin costo</div>
                <div className="mt-1">No necesitan cuenta.</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">Evidencia verificable</div>
                <div className="mt-1">Hash + auditoría + timestamps.</div>
              </div>
              <div className="rounded-lg border border-zinc-200 p-3">
                <div className="font-medium text-zinc-900">PDF final con QR</div>
                <div className="mt-1">Verificación pública.</div>
              </div>
            </div>
          </div>

          {/* MOCK */}
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
                  <div className="mt-1 font-medium">Autorización / Contrato / Consentimiento</div>
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
                    Eventos con IP, user-agent y timestamp. Verificación pública por QR.
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
                <div className="font-medium text-zinc-900">Importante</div>
                <div className="mt-1">
                  FES implementa firma electrónica. No es firma digital certificada (token/certificado).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ ES / QUÉ NO ES */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold">¿Qué es FES y qué no es?</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Firma Electrónica Simple (FES) permite firmar PDFs online dejando constancia clara de la voluntad de las partes,
          con evidencia técnica verificable.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-5">
            <div className="font-medium text-zinc-900">✔️ FES es</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Firma electrónica válida en Argentina (Ley 25.506).</li>
              <li>Rápida y fácil, sin certificados digitales.</li>
              <li>Ideal para acuerdos, autorizaciones y consentimientos.</li>
              <li>PDF final verificable con hash, auditoría y QR.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5">
            <div className="font-medium text-zinc-900">❌ FES no es</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>No es firma digital certificada (no usa token/certificado).</li>
              <li>No reemplaza escribano ni actos notariales.</li>
              <li>No aplica a trámites que exigen firma digital avanzada.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
            Crear una firma
          </Link>
          <Link href="/terms" className="text-sm text-zinc-700 hover:text-zinc-900">
            Términos
          </Link>
          <Link href="/privacy" className="text-sm text-zinc-700 hover:text-zinc-900">
            Privacidad
          </Link>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Cómo funciona</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { t: "Subí el PDF", d: "Cargás tu documento en formato PDF." },
              { t: "Invitá firmantes", d: "Reciben un enlace seguro por email." },
              { t: "Firman online", d: "Firma manuscrita + consentimiento + datos." },
              { t: "Descargá el final", d: "PDF final con evidencia y auditoría." },
            ].map((s) => (
              <div key={s.t} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="font-medium">{s.t}</div>
                <div className="mt-1 text-sm text-zinc-600">{s.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="font-medium text-zinc-900">Verificación pública</div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              El documento final incluye un código y un QR para verificación. Se valida integridad del archivo y coincidencia
              del hash con el registro de auditoría.
            </p>
          </div>
        </div>
      </section>

      {/* CASOS DE USO / NO USAR */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-2xl font-semibold">¿Para qué sirve?</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 p-5">
            <div className="font-medium text-zinc-900">Casos ideales</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Acuerdos entre partes</li>
              <li>Autorizaciones</li>
              <li>Consentimientos informados</li>
              <li>Contratos simples</li>
              <li>Aceptaciones de términos</li>
              <li>Documentación interna</li>
              <li>Aprobaciones comerciales</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 p-5">
            <div className="font-medium text-zinc-900">Cuándo no usar FES</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Trámites que exigen firma digital certificada</li>
              <li>Presentaciones que requieren token/certificado</li>
              <li>Escrituras o actos notariales</li>
            </ul>
          </div>
        </div>
      </section>

      {/* LEGAL & CTA FINAL */}
      <section className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Legal y seguridad</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="font-medium">Cumplimiento</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Implementamos firma electrónica conforme a la Ley 25.506. Generamos evidencia técnica para respaldar
                integridad y trazabilidad (hash SHA-256, timestamps y auditoría de eventos).
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="font-medium">Protección de datos</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                PDFs en almacenamiento privado, acceso por URLs firmadas temporales y registros de auditoría. El acceso a la
                evidencia está restringido y se maneja bajo políticas del servicio.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
              Empezar ahora
            </Link>
            <Link href="/terms" className="text-sm text-zinc-700 hover:text-zinc-900">
              Términos
            </Link>
            <Link href="/privacy" className="text-sm text-zinc-700 hover:text-zinc-900">
              Privacidad
            </Link>
          </div>

          <p className="mt-6 text-xs text-zinc-600">
            Este servicio implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma
            digital certificada.
          </p>
        </div>
      </section>
    </div>
  );
}
