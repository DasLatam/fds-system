import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CTA_PRIMARY =
  "inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

const CTA_SECONDARY =
  "inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

const CHIP = "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800";

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-zinc-600">{desc}</div>
    </div>
  );
}

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-emerald-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={CHIP}>Ley 25.506 · Firma electrónica</span>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                  No es firma digital certificada
                </span>
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900">
                Fácil de firmar.
                <span className="block text-zinc-700">Rápido para cerrar acuerdos.</span>
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-zinc-700">
                Firmá documentos entre varias personas sin importar la distancia. Creás el documento, enviás un link y cada
                firmante completa y firma desde su celular o computadora.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {user ? (
                  <>
                    <Link href="/dashboard" className={CTA_PRIMARY}>
                      Ir al panel
                    </Link>
                    <Link href="/dashboard/new" className={CTA_SECONDARY}>
                      Nuevo documento
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={CTA_PRIMARY}>
                      Ingresar
                    </Link>
                    <Link href="/pricing" className={CTA_SECONDARY}>
                      Ver planes
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="text-xs text-zinc-500">1) Creás</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">Documento en minutos</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="text-xs text-zinc-500">2) Invitás</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">Acceso por link</div>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="text-xs text-zinc-500">3) Cerrás</div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">PDF final con registro</div>
                </div>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-zinc-500">
                Firma Electrónica Simple (FES) implementa firma electrónica conforme a la Ley 25.506 (República Argentina).
                No constituye firma digital certificada.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Ejemplo de firma</div>
                    <div className="mt-1 text-xs text-zinc-500">Vista previa ilustrativa del flujo de firma.</div>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Listo para firmar</div>
                </div>

                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">Acuerdo de prestación de servicios</div>
                      <div className="mt-1 text-xs text-zinc-500">ID: FES-2026-000318 · 2 firmantes</div>
                    </div>
                    <div className="text-xs text-zinc-500">Estado: pendiente</div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm text-zinc-700">
                    <p>
                      Entre <span className="font-medium">Parte A</span> y <span className="font-medium">Parte B</span>, se acuerdan los términos
                      del servicio conforme lo detallado en el presente documento.
                    </p>

                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-xs text-zinc-500">Firmante 1</div>
                          <div className="mt-1 font-medium text-zinc-900">María Pérez</div>
                          <div className="mt-1 text-xs text-zinc-500">DNI 30.123.456</div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-500">Firmante 2</div>
                          <div className="mt-1 font-medium text-zinc-900">Juan García</div>
                          <div className="mt-1 text-xs text-zinc-500">DNI 28.987.654</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <div className="text-xs text-zinc-500">Firma</div>
                        <div className="mt-2 h-10 w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50" />
                      </div>
                      <div className="rounded-lg border border-zinc-200 bg-white p-3">
                        <div className="text-xs text-zinc-500">Aclaración</div>
                        <div className="mt-2 h-10 w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-zinc-500">Se registra evidencia del proceso (eventos y metadatos).</div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-zinc-700">Acceso por link</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={CHIP}>Acceso por link</span>
                  <span className={CHIP}>Historial & auditoría</span>
                  <span className={CHIP}>PDF final descargable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-zinc-900">Beneficios que se sienten en el día a día</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
            Reducí idas y vueltas: una invitación por link y un proceso guiado. Ideal para acuerdos, autorizaciones,
            conformidades, consentimientos y documentos internos.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Feature
            title="Firma a distancia, sin complicaciones"
            desc="Cada firmante recibe su invitación y firma desde cualquier lugar. No importa si están en otra ciudad o en otro país."
          />
          <Feature
            title="Acceso seguro por link"
            desc="Enviás un link único por email para que la persona firme. Ideal para flujos rápidos, sin usuarios adicionales ni instalaciones."
          />
          <Feature
            title="Trazabilidad y auditoría"
            desc="Se registra un historial de eventos del proceso (por ejemplo: invitación, apertura, firma, finalización) para respaldar el documento."
          />
          <Feature
            title="Validez probatoria y PDF final"
            desc="Al finalizar, se genera un PDF final descargable. La evidencia y el historial ayudan a sostener el proceso en contextos probatorios."
          />
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-zinc-900">¿Listo para firmar tu primer documento?</div>
              <div className="mt-1 text-sm text-zinc-600">Entrás con Magic Link. Sin contraseñas y fácil de usar.</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={user ? "/dashboard/new" : "/login"} className={CTA_PRIMARY}>
                {user ? "Nuevo documento" : "Ingresar"}
              </Link>
              <Link href="/pricing" className={CTA_SECONDARY}>
                Planes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
