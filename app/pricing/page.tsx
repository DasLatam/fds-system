import Link from "next/link";
import { PLAN_DEFINITIONS, formatArs, type PlanCode } from "@/lib/plans";

export const dynamic = "force-dynamic";

const CTA_PRIMARY =
  "inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

const CTA_SECONDARY =
  "inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

function PriceBlock({
  priceArs,
  listPriceArs,
  suffix,
  pricePrefix,
}: {
  priceArs: number;
  listPriceArs?: number;
  suffix?: string;
  pricePrefix?: string;
}) {
  const isFree = Number(priceArs) === 0;

  return (
    <div className="mt-4">
      <div className="text-3xl font-semibold tracking-tight text-zinc-900">
        {pricePrefix ? <span className="mr-2 text-sm font-semibold text-zinc-500">{pricePrefix}</span> : null}
        {isFree ? "Gratis" : formatArs(priceArs)}
        {suffix ? <span className="ml-2 text-sm font-medium text-zinc-500">{suffix}</span> : null}
      </div>

      {typeof listPriceArs === "number" && listPriceArs > 0 ? (
        <div className="mt-2 text-sm text-zinc-500">
          <span className="mr-2">Antes</span>
          <span className="line-through">{formatArs(listPriceArs)}</span>
        </div>
      ) : null}

      <div className="mt-2 text-xs text-zinc-500">Fácil de firmar: Magic Link por email.</div>
    </div>
  );
}

function FeatureLine({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${included ? "text-zinc-700" : "text-zinc-400"}`}>
      <span className={"mt-1 inline-block h-1.5 w-1.5 rounded-full " + (included ? "bg-emerald-600" : "bg-zinc-300")} />
      <span className={included ? "" : "line-through"}>{children}</span>
      {!included ? <span className="ml-2 text-xs no-underline">(No incluido)</span> : null}
    </li>
  );
}

function isIncluded(code: PlanCode, feature: string): boolean {
  if (feature === "team_admin") return code === "company_pro";
  if (feature === "templates") return code === "company_pro";
  if (feature === "volume") return code === "company_pro";
  if (feature === "support") return code === "individual_pro" || code === "company_pro";
  return true;
}

export default function PricingPage() {
  const plans = Object.values(PLAN_DEFINITIONS).sort((a, b) => a.priceArs - b.priceArs);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Planes simples</h1>
        <p className="mt-2 text-sm text-zinc-600">Elegí el plan que necesitás hoy. Podés cambiarlo más adelante.</p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const code = p.code as PlanCode;

          // UI-only: destacamos el plan Empresa como recomendado.
          const recommended = code === "company_pro";

          // Requisito: plan gratuito debe mostrar "antes ARS 9.900,00 / ahora Gratis".
          const listPriceArs = code === "individual_free" ? 9900 : p.listPriceArs;

          // PlanDefinition no tiene description: usamos highlights como “subcopy”.
          const description = Array.isArray(p.highlights) && p.highlights.length > 0 ? p.highlights.join(" · ") : "Fácil de firmar, rápido y simple.";

          return (
            <div
              key={p.code}
              className={
                "flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm " +
                (recommended ? "border-emerald-300 ring-1 ring-emerald-200" : "border-zinc-200")
              }
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{p.label}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{description}</p>
                  </div>

                  {recommended ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                      Recomendado
                    </span>
                  ) : null}
                </div>

                <PriceBlock
                  pricePrefix={p.pricePrefix}
                  priceArs={p.priceArs}
                  listPriceArs={listPriceArs}
                  suffix={"/ mes"}
                />

                <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Incluye</div>

                  <ul className="mt-3 space-y-2 text-sm">
                    <FeatureLine included={true}>
                      Creación de hasta <span className="font-medium">{p.defaultMonthlyCreateLimit}</span> documentos por mes
                    </FeatureLine>
                    <FeatureLine included={true}>Acceso por link para firmantes (sin registro adicional)</FeatureLine>
                    <FeatureLine included={true}>Historial del proceso y trazabilidad básica</FeatureLine>
                    <FeatureLine included={true}>Autocompletado con tus datos de perfil</FeatureLine>

                    <FeatureLine included={isIncluded(code, "support")}>Mesa de ayuda y soporte</FeatureLine>
                    <FeatureLine included={isIncluded(code, "team_admin")}>
                      Varios responsables de firma y administración (cuentas de equipo)
                    </FeatureLine>
                    <FeatureLine included={isIncluded(code, "templates")}>Plantillas editables (próximamente)</FeatureLine>
                    <FeatureLine included={isIncluded(code, "volume")}>Planes por volumen y facturación a empresas</FeatureLine>
                  </ul>
                </div>
              </div>

              <div className="mt-6" />

              <div className="mt-auto flex flex-col gap-3">
                <Link href="/login" className={recommended ? CTA_PRIMARY : CTA_SECONDARY}>
                  {code === "individual_free" ? "Empezar gratis" : "Elegir este plan"}
                </Link>

                <Link href="/" className="text-center text-sm text-zinc-500 hover:text-zinc-800">
                  Ver la demo
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-base font-semibold text-zinc-900">Notas legales y de uso</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>FES implementa firma electrónica conforme a la Ley 25.506 (Argentina). No constituye firma digital certificada.</li>
          <li>
            Los límites mensuales aplican a la <span className="font-medium">creación</span> de documentos en la cuenta activa.
          </li>
          <li>Podés cambiar de plan en cualquier momento. Si necesitás mayor volumen, el plan Empresa contempla opciones por volumen.</li>
        </ul>
      </div>
    </div>
  );
}
