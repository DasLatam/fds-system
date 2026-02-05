import Link from "next/link";
import { PLAN_DEFINITIONS, formatArs } from "@/lib/plans";

function Price({ pricePrefix, priceArs, listPriceArs }: { pricePrefix?: string; priceArs: number; listPriceArs?: number }) {
  if (priceArs === 0) {
    return <div className="text-3xl font-semibold">{formatArs(0)}</div>;
  }

  return (
    <div className="flex items-end gap-2">
      <div className="text-3xl font-semibold">
        {pricePrefix ? `${pricePrefix} ` : ""}{formatArs(priceArs)}
      </div>
      <div className="pb-1 text-sm text-zinc-500">/ mes</div>
      {listPriceArs ? (
        <div className="pb-1 text-sm text-zinc-400 line-through">{formatArs(listPriceArs)}</div>
      ) : null}
    </div>
  );
}

function weeklyHint(monthly: number) {
  // Mapeo simple para el marketing (semanas aproximadas)
  if (monthly === 4) return 1;
  if (monthly === 20) return 5;
  if (monthly === 30) return 7;
  return Math.max(1, Math.round(monthly / 4));
}

export default function PricingPage() {
  const plans = [PLAN_DEFINITIONS.individual_free, PLAN_DEFINITIONS.individual_pro, PLAN_DEFINITIONS.company_pro];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold">Planes</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Elegí el plan que mejor se adapta a tu volumen de trabajo. Todos los planes incluyen firma electrónica simple,
          auditoría y evidencia verificable (hash, trazabilidad y registro de eventos).
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.code} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-600">{p.label}</div>
              <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700">
                  {weeklyHint(p.defaultMonthlyCreateLimit)}/semana · {p.defaultMonthlyCreateLimit}/mes
              </div>
            </div>

            <div className="mt-3">
              <Price pricePrefix={p.pricePrefix} priceArs={p.priceArs} listPriceArs={p.listPriceArs} />
            </div>

            <ul className="mt-4 space-y-1 text-sm text-zinc-700">
              {p.highlights.map((h) => (
                <li key={h}>• {h}</li>
              ))}
            </ul>

            <div className="mt-5 border-t border-zinc-200 pt-5">
              <div className="text-sm font-medium">Incluye</div>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
                {p.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Link href="/login" className="inline-flex w-full justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
                Empezar
              </Link>
              <div className="mt-2 text-xs text-zinc-500">Sin fricción: Magic Link por email.</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="text-sm font-semibold">Aclaraciones</div>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          <li>
            <span className="font-medium">Firmas ilimitadas</span> aplica a la acción de firmar como firmante. La creación de
            documentos para solicitar firmas tiene un límite mensual según plan.
          </li>
          <li>
            Los límites pueden ampliarse mediante planes por volumen o acuerdos específicos.
          </li>
        </ul>
      </div>
    </div>
  );
}
