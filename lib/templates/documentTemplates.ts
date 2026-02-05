export type DocumentTemplate = {
  id: string;
  name: string;
  description: string;
  html: string;
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "blank",
    name: "En blanco",
    description: "Documento vacío para redactar desde cero.",
    html: "<h1>Título del documento</h1><p>Escribí el contenido acá...</p>",
  },
  {
    id: "acta",
    name: "Acta simple",
    description: "Acta breve con lugar, fecha y firmas.",
    html:
      "<h1>ACTA</h1>" +
      "<p>En la ciudad de __________, a los ___ días del mes de __________ de ____...</p>" +
      "<p>Comparecen: __________ (DNI __________) y __________ (DNI __________), quienes manifiestan...</p>" +
      "<h2>Cláusulas</h2>" +
      "<ol><li>Objeto: __________</li><li>Alcance: __________</li><li>Vigencia: __________</li></ol>" +
      "<p>Leída la presente, se firma en conformidad.</p>" +
      "<p><strong>Firmas</strong><br/>__________________________<br/>__________________________</p>",
  },
  {
    id: "acuerdo",
    name: "Acuerdo básico",
    description: "Acuerdo genérico con obligaciones y vigencia.",
    html:
      "<h1>ACUERDO</h1>" +
      "<p>Entre __________, en adelante \"Parte A\", y __________, en adelante \"Parte B\", se acuerda lo siguiente:</p>" +
      "<h2>1. Objeto</h2><p>__________</p>" +
      "<h2>2. Obligaciones</h2><ul><li>Parte A: __________</li><li>Parte B: __________</li></ul>" +
      "<h2>3. Vigencia</h2><p>__________</p>" +
      "<h2>4. Jurisdicción</h2><p>Para cualquier controversia, las partes se someten a los tribunales de __________.</p>" +
      "<p><strong>Firmas</strong><br/>__________________________<br/>__________________________</p>",
  },
];

export function getTemplateById(id: string | null | undefined): DocumentTemplate {
  const found = DOCUMENT_TEMPLATES.find((t) => t.id === id);
  return found || DOCUMENT_TEMPLATES[0];
}
