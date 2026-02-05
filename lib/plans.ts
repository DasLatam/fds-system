export type PlanCode = "individual_free" | "individual_pro" | "company_pro";
export type PlanChoice = "free" | "individual_pro" | "company_pro";

export type PlanDefinition = {
  code: PlanCode;
  choice: PlanChoice;

  /** Etiqueta pública */
  label: string;
  /** Etiqueta corta (chips, etc.) */
  shortLabel: string;

  /** Precio vigente (mensual), en ARS */
  priceArs: number;
  /** Precio de lista (tachado) */
  listPriceArs?: number;
  /** Prefijo del precio (ej: "desde") */
  pricePrefix?: string;

  /** Límite mensual de creación de documentos (valor de referencia UI; la fuente de verdad es el server/env). */
  defaultMonthlyCreateLimit: number;

  /** Highlights cortos (marketing) */
  highlights: string[];

  /** Beneficios en bullets */
  benefits: string[];
};

export const PLAN_DEFINITIONS: Record<PlanCode, PlanDefinition> = {
  individual_free: {
    code: "individual_free",
    choice: "free",
    label: "Personal Gratuito",
    shortLabel: "Gratuito",
    priceArs: 0,
    defaultMonthlyCreateLimit: 4,
    highlights: ["Para uso personal", "Firmas ilimitadas", "Hasta 4 documentos/mes"],
    benefits: [
      "Autocompletado de datos personales en firmas (cuando estás logueado)",
      "Firmá documentos sin límite (como firmante)",
      "Creá hasta 4 documentos por mes (aprox. 1 por semana)",
      "Historial y auditoría técnica de eventos",
    ],
  },
  individual_pro: {
    code: "individual_pro",
    choice: "individual_pro",
    label: "Personal Profesional",
    shortLabel: "Personal PRO",
    // Propuesta del usuario: 24.500 oferta; se muestra lista más alta.
    priceArs: 24500,
    listPriceArs: 39900,
    defaultMonthlyCreateLimit: 20,
    highlights: ["Para trabajo frecuente", "Firmas ilimitadas", "Hasta 20 documentos/mes"],
    benefits: [
      "Autocompletado de datos personales en firmas (cuando estás logueado)",
      "Firmá documentos sin límite (como firmante)",
      "Creá hasta 20 documentos por mes (aprox. 5 por semana)",
      "Posibilidad de ampliar el límite mensual (según disponibilidad)",
      "Mesa de ayuda y soporte de uso",
    ],
  },
  company_pro: {
    code: "company_pro",
    choice: "company_pro",
    label: "Empresa",
    shortLabel: "Empresa",
    pricePrefix: "desde",
    priceArs: 57600,
    listPriceArs: 89900,
    defaultMonthlyCreateLimit: 30,
    highlights: ["Para equipos", "Roles y cuentas", "Hasta 30 documentos/mes"],
    benefits: [
      "Autocompletado de datos personales en firmas (cuando estás logueado)",
      "Firmá documentos sin límite (como firmante)",
      "Varios responsables de firma y cuentas por organización",
      "Creá hasta 30 documentos por mes (aprox. 7 por semana)",
      "Acceso a plantillas editables de contratos y documentos frecuentes",
      "Planes por volumen para campañas específicas",
      "Mesa de ayuda y soporte para equipos",
    ],
  },
};

export function formatArs(amount: number) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    // fallback sin Intl
    const s = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `ARS ${s},00`;
  }
}

export function planLabelFromCode(planCode: string | null | undefined) {
  const code = normalizePlanCode(planCode, null);
  return PLAN_DEFINITIONS[code].label;
}

export function planShortLabelFromCode(planCode: string | null | undefined) {
  const code = normalizePlanCode(planCode, null);
  return PLAN_DEFINITIONS[code].shortLabel;
}

export function normalizePlanCode(planCode: string | null | undefined, legacyProfilePlan: string | null | undefined): PlanCode {
  const p = (planCode || "").trim().toLowerCase();
  if (p) {
    if (p.includes("company") && p.includes("pro")) return "company_pro";
    if (p.includes("individual") && p.includes("pro")) return "individual_pro";
    if (p === "company_pro") return "company_pro";
    if (p === "individual_pro") return "individual_pro";
    if (p === "individual_free" || p === "free") return "individual_free";
    // fallback razonable
    if (p.includes("pro")) return "individual_pro";
    return "individual_free";
  }

  const legacy = (legacyProfilePlan || "").trim().toLowerCase();
  if (legacy === "pro") return "individual_pro";
  return "individual_free";
}

export function planCodeFromChoice(choice: PlanChoice): PlanCode {
  if (choice === "company_pro") return "company_pro";
  if (choice === "individual_pro") return "individual_pro";
  return "individual_free";
}

export function planChoiceFromCode(planCode: string | null | undefined, legacyProfilePlan?: string | null): PlanChoice {
  const code = normalizePlanCode(planCode, legacyProfilePlan ?? null);
  return PLAN_DEFINITIONS[code].choice;
}

export function getPlanDefinition(planCode: string | null | undefined, legacyProfilePlan?: string | null) {
  const code = normalizePlanCode(planCode, legacyProfilePlan ?? null);
  return PLAN_DEFINITIONS[code];
}

