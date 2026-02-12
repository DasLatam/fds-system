import Link from "next/link";
import { PLAN_DEFINITIONS } from "@/lib/plans";

export const dynamic = "force-dynamic";

const RECOMMENDED_CODE = "individual_pro";

// Precio “antes” (solo donde aplica). No depende del tipo PlanDefinition.
const OLD_PRICE_BY_CODE: Record<string, number | undefined> = {
  individual_free: 9900,
  // Si en el futuro querés mostrar “antes” para otros planes:
  // individual_pro: 19900,
  // company_pro: 0,
};

function formatArs(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PricingPage() {
  const plans = [
    PLAN_DEFINITIONS.individual_free,
    PLAN_DEFINITIONS.individual_pro,
    PLAN_DEFINITIONS.company_pro,
  ];

  // Base de features: el plan Empresa define el set “completo”
  const allFeatures = PLAN_DEFINITIONS.company_pro.benefits ?? [];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-zinc-900">Planes simples, precios claros</h1>
          <p className="mt-3 text-base text-zinc-600">
            Elegí el plan según tu uso. Siempre podés cambiarlo desde{" "}
            <Link href="/dashboard/account" className="underline">
              Cuentas
            </Link>
            .
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isRecommended = p.code === RECOMMENDED_CODE;
            const isCompany = p.code === "company_pro";

            const offer = p.priceArs ?? 0;
            const old = OLD_PRICE_BY_CODE[p.code];

            const planBenefits = p.benefits ?? [];

            return (
              <div
                key={p.code}
                className={
                  "flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm " +
                  (isRecommended ? "border-emerald-300 ring-1 ring-emerald-200" : "border-zinc-200")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{p.label}</h2>
                    {/* Evito depender de propiedades que no estén tipadas */}
                    <p className="mt-1 text-sm text-zinc-600">{(p as any).description ?? (p as any).shortLabel ?? ""}</p>
                  </div>

                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Sugerido
                    </span>
                  ) : null}
                </div>

                {/* Precio: oferta arriba, anterior abajo tachado */}
                <div className="mt-5">
                  <div className="text-3xl font-semibold text-zinc-900">
                    {offer === 0 ? "Gratis" : formatArs(offer)}
                  </div>

                  <div className="mt-1 text-sm text-zinc-600">
                    {typeof old === "number" && old > offer ? (
                      <span>
                        Antes <span className="line-through">{formatArs(old)}</span>
                      </span>
                    ) : null}
                  </div>

                  {offer > 0 ? <div className="mt-1 text-xs text-zinc-500">Por mes</div> : null}
                </div>

                {/* Features normalizadas con el plan Empresa como baseline */}
                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Incluye</div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {allFeatures.map((feat) => {
                      const included = planBenefits.includes(feat);
                      return (
                        <li key={feat} className={included ? "text-zinc-800" : "text-zinc-500"}>
                          •{" "}
                          {included ? (
                            feat
                          ) : (
                            <span className="line-through">{feat}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-auto pt-6">
                  {isCompany ? (
                    <Link
                      href="/contact"
                      className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                      Contactar
                    </Link>
                  ) : (
                    <Link
                      href="/login?next=/dashboard/account"
                      className={
                        "inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
                        (isRecommended
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-600"
                          : "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400")
                      }
                    >
                      Elegir plan
                    </Link>
                  )}

                  <p className="mt-3 text-xs text-zinc-500">
                    Firma electrónica simple (Ley 25.506 art. 5). No es firma digital certificada.
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700">
          <div className="font-semibold text-zinc-900">¿Qué significa “Fácil de firmar”?</div>
          <p className="mt-2">
            Que podés invitar a firmantes por link, desde cualquier lugar, con trazabilidad y auditoría de eventos.
          </p>
        </div>
      </div>
    </div>
  );
}
