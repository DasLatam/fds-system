import Link from "next/link";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
      {children}
    </a>
  );
}

export default function TermsPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Términos y Condiciones</h1>
        <p className="text-sm text-zinc-600">Última actualización: {updated}.</p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
          <b>Resumen:</b> Firma Electrónica Simple ("FES") ofrece una herramienta de <b>firma electrónica</b> (no firma digital certificada) para documentos PDF, con evidencia técnica: hash SHA-256, timestamp, IP, user-agent y auditoría por evento.
        </div>
      </div>

      <div className="prose prose-zinc mt-8 max-w-none">
        <h2>1. Definiciones</h2>
        <ul>
          <li><b>Firma electrónica:</b> conjunto de datos electrónicos que puede ser utilizado como medio de identificación del firmante y evidencia de su voluntad.</li>
          <li><b>Documento:</b> PDF subido por el Creador para ser firmado.</li>
          <li><b>Creador:</b> usuario autenticado que sube un documento y define firmantes.</li>
          <li><b>Firmante:</b> persona invitada mediante un enlace único que realiza el acto de firma.</li>
        </ul>

        <h2>2. Marco legal aplicable</h2>
        <p>
          FES está diseñado para aportar <b>evidencia técnica</b> consistente con normativa argentina, principalmente:
        </p>
        <ul>
          <li>
            <b>Ley 25.506 (Firma Digital)</b>. FES implementa un mecanismo de <b>firma electrónica</b> (no firma digital con certificado). Documento oficial:
            {" "}
            <ExternalLink href="https://www.argentina.gob.ar/normativa/nacional/ley-25506-70749">
              Argentina.gob.ar (InfoLEG)
            </ExternalLink>
            .
          </li>
          <li>
            <b>Código Civil y Comercial</b> – instrumentos particulares y firma (Arts. 286–288). Texto oficial:
            {" "}
            <ExternalLink href="https://www.argentina.gob.ar/normativa/nacional/ley-26994-235975">
              Argentina.gob.ar (InfoLEG)
            </ExternalLink>
            .
          </li>
          <li>
            <b>Ley 25.326 (Datos Personales)</b>. Texto oficial:
            {" "}
            <ExternalLink href="https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790">
              Argentina.gob.ar (InfoLEG)
            </ExternalLink>
            .
          </li>
        </ul>
        <div className="not-prose mt-4 grid gap-3 rounded-2xl border border-zinc-200 p-5">
          <div className="text-sm font-medium">Citas breves (referencia orientativa)</div>
          <ul className="text-sm text-zinc-700">
            <li>• Ley 25.506: “se entiende por firma electrónica…” (art. 5).</li>
            <li>• CCCN: “la firma prueba la autoría…” (art. 288).</li>
            <li>• Ley 25.326: principios de consentimiento e información (arts. 5 y 6).</li>
          </ul>
          <p className="text-xs text-zinc-500">
            Nota: estas citas son breves; el texto completo se consulta en los links oficiales.
          </p>
        </div>

        <h2>3. Alcance del servicio</h2>
        <p>
          El Creador sube un PDF, define firmantes (paralelo o secuencial) y el sistema envía invitaciones. El Firmante accede con un enlace único, visualiza el PDF y firma con trazo. FES genera un PDF final con un sello de evidencia (hash SHA-256, timestamp e información forense).
        </p>
        <p>
          FES no revisa el contenido del documento ni brinda asesoramiento legal. El Creador es responsable del contenido, de la pertinencia del acto jurídico y de las consecuencias de su uso.
        </p>

        <h2>4. Identidad y declaración del firmante</h2>
        <p>
          Para reforzar evidencia, el Firmante debe completar datos mínimos de identificación (nombre completo, DNI, CUIL, domicilio y celular) y aceptar un consentimiento informado antes de enviar la firma. En una fase posterior se podrá incorporar verificación adicional (ej.: captura de DNI y prueba de vida).
        </p>

        <h2>5. Seguridad y registro forense</h2>
        <p>
          FES registra auditoría por evento (por ejemplo: creación, carga, invitación, envío, apertura, vista previa, firma, emisión de timestamp y finalización). Además, el PDF final incorpora evidencia técnica.
        </p>
        <ul>
          <li><b>Hash SHA-256</b> del PDF original para detectar modificaciones.</li>
          <li><b>Timestamp</b> (fecha/hora) y evidencia del entorno (IP, user-agent).</li>
          <li><b>Enlaces únicos</b> por firmante, con vencimiento configurable.</li>
          <li><b>Rate limiting</b> y controles en middleware para reducir abuso.</li>
        </ul>

        <h2>6. Vencimientos, rechazo y reenvíos</h2>
        <p>
          Cada invitación tiene un vencimiento mínimo de 3 días (configurable). El Firmante puede <b>rechazar</b> indicando un motivo. En caso de rechazo o vencimiento, el Creador puede re-enviar una nueva invitación.
        </p>

        <h2>7. Planes, uso gratuito y límites</h2>
        <p>
          Firmar siempre es gratuito. Para subir documentos se ofrece un cupo gratuito semanal y planes por volumen.
          Los precios y condiciones se detallan en {" "}
          <Link href="/pricing">Planes</Link>.
        </p>

        <h2>8. Retención y disponibilidad</h2>
        <p>
          Por políticas de seguridad y trazabilidad, FES puede conservar documentos y evidencias por hasta <b>10 años</b>. El acceso se limita a las partes autorizadas. La disponibilidad a terceros se realiza únicamente ante orden judicial o requerimiento legal aplicable.
        </p>

        <h2>9. Limitación de responsabilidad</h2>
        <p>
          El servicio se brinda “tal cual”. FES no garantiza que el documento sea admisible o suficiente como prueba en todos los casos: eso depende del acto jurídico, jurisdicción, pericia y demás circunstancias.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Para consultas de soporte o solicitudes legales: <b>firmasimple@daslatam.org</b> (a definir en producción).
        </p>
      </div>
    </div>
  );
}
