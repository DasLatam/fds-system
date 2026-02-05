import { normalizePlanCode, type PlanCode, PLAN_DEFINITIONS } from "./plans";

function parseEnvInt(name: string, fallback: number) {
  const raw = process.env[name];
  const n = Number(raw || "");
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Límite mensual de creación de documentos.
 * Fuente de verdad: variables de entorno en Vercel (requieren redeploy al cambiar).
 */
export function getMonthlyCreateLimitFromPlanCode(planCode: string | null | undefined, legacyProfilePlan?: string | null) {
  const code: PlanCode = normalizePlanCode(planCode, legacyProfilePlan ?? null);

  if (code === "company_pro") return parseEnvInt("FES_COMPANY_PRO_DOCS_PER_MONTH", PLAN_DEFINITIONS.company_pro.defaultMonthlyCreateLimit);
  if (code === "individual_pro") return parseEnvInt("FES_INDIVIDUAL_PRO_DOCS_PER_MONTH", PLAN_DEFINITIONS.individual_pro.defaultMonthlyCreateLimit);

  return parseEnvInt("FES_FREE_DOCS_PER_MONTH", PLAN_DEFINITIONS.individual_free.defaultMonthlyCreateLimit);
}
