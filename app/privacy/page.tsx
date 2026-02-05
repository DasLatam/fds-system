import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | FES",
  description: "Política de privacidad y tratamiento de datos personales en Firma Electrónica Simple (FES).",
};

const UPDATED_AT = "4 de febrero de 2026";

function TocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm text-zinc-700 hover:text-zinc-900">
      {children}
    </a>
  );
}

function LegalRef({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs text-zinc-800">{children}</span>;
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-zinc-600">Última actualización: {UPDATED_AT}</p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Esta política describe cómo FES trata datos personales en el marco de la prestación del servicio de firma
          electrónica. Aplican, entre otras, la <LegalRef>Ley 25.326</LegalRef> y normas complementarias.
        </div>
      </div>

      <div className="mb-10 rounded-xl border border-zinc-200 p-4">
        <div className="text-sm font-semibold text-zinc-900">Índice</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <TocLink href="#responsable">1. Responsable y contacto</TocLink>
          <TocLink href="#datos">2. Datos que recopilamos</TocLink>
          <TocLink href="#finalidades">3. Finalidades y base legal</TocLink>
          <TocLink href="#fuentes">4. Fuentes de los datos</TocLink>
          <TocLink href="#comparticion">5. Compartición y subprocesadores</TocLink>
          <TocLink href="#transferencias">6. Transferencias internacionales</TocLink>
          <TocLink href="#seguridad">7. Seguridad</TocLink>
          <TocLink href="#retencion">8. Retención y eliminación</TocLink>
          <TocLink href="#derechos">9. Derechos del titular</TocLink>
          <TocLink href="#cookies">10. Cookies y analítica</TocLink>
          <TocLink href="#cambios">11. Cambios</TocLink>
          <TocLink href="#anexo">12. Anexo legal (extractos)</TocLink>
        </div>
      </div>

      <article className="prose prose-zinc max-w-none leading-relaxed">
        <h2 id="responsable">1. Responsable y contacto</h2>
        <p>
          El responsable del tratamiento asociado a FES es el operador del servicio. Para consultas o ejercicio de derechos
          podés escribir a <a href="mailto:firmasimple@daslatam.org">firmasimple@daslatam.org</a>.
        </p>

        <h2 id="datos">2. Datos que recopilamos</h2>
        <p>Según el uso del servicio, podemos tratar:</p>
        <ul>
          <li>
            <b>Datos de cuenta:</b> email, identificadores internos, configuración de cuenta activa/plan.
          </li>
          <li>
            <b>Datos de perfil:</b> nombre y apellido, DNI/CUIL/CUIT (según corresponda), domicilio, teléfono.
          </li>
          <li>
            <b>Datos de documento:</b> PDFs cargados, metadatos del documento (título, fechas, firmantes, estados).
          </li>
          <li>
            <b>Datos de firma:</b> trazos de firma manuscrita (si se captura), consentimiento, y datos declarados al
            momento de firmar.
          </li>
          <li>
            <b>Datos técnicos:</b> IP, user-agent, timestamps, eventos de auditoría, tokens de invitación/validación.
          </li>
          <li>
            <b>Comunicaciones:</b> envíos de emails transaccionales (invitaciones, enlaces de acceso, notificaciones).
          </li>
        </ul>

        <h2 id="finalidades">3. Finalidades y base legal</h2>
        <ul>
          <li>
            <b>Prestación del servicio:</b> creación, invitación, firma/rechazo, generación de PDF final y verificación.
          </li>
          <li>
            <b>Seguridad y prevención de fraude:</b> auditoría, detección de abuso, investigación de incidentes.
          </li>
          <li>
            <b>Soporte:</b> atención de consultas y resolución de problemas.
          </li>
          <li>
            <b>Cumplimiento:</b> respuesta a requerimientos legales y ejercicio/defensa de derechos.
          </li>
        </ul>
        <p>
          La base legal puede incluir: (a) consentimiento cuando corresponda (<LegalRef>Ley 25.326, art. 5</LegalRef>),
          (b) ejecución de una relación contractual/solicitud de servicios, y (c) interés legítimo en seguridad y
          continuidad operativa, en la medida permitida por la normativa aplicable.
        </p>

        <h2 id="fuentes">4. Fuentes de los datos</h2>
        <ul>
          <li>Datos proporcionados por el Usuario y/o firmantes al utilizar el servicio.</li>
          <li>Datos técnicos generados por el uso normal (logs, auditoría, timestamps, IP, user-agent).</li>
          <li>Datos derivados (p. ej. hashes de integridad y estados del proceso).</li>
        </ul>

        <h2 id="comparticion">5. Compartición y subprocesadores</h2>
        <p>
          Para operar el servicio utilizamos proveedores (subprocesadores) que tratan datos por cuenta nuestra bajo un
          modelo de responsabilidad compartida. Típicamente:
        </p>
        <ul>
          <li>
            <b>Vercel</b> (hosting/edge): <a href="https://vercel.com/docs/security/compliance" target="_blank" rel="noreferrer">seguridad y compliance</a>.
          </li>
          <li>
            <b>Supabase</b> (auth, base de datos, storage): <a href="https://supabase.com/security" target="_blank" rel="noreferrer">seguridad</a>.
          </li>
          <li>
            <b>Resend</b> (email): <a href="https://resend.com/docs/security" target="_blank" rel="noreferrer">seguridad</a>.
          </li>
          <li>
            <b>Upstash</b> (rate limiting/colas): <a href="https://upstash.com/docs/common/help/compliance" target="_blank" rel="noreferrer">compliance</a>.
          </li>
        </ul>
        <p>
          También podemos compartir datos con autoridades competentes cuando exista obligación legal, o con asesores
          profesionales bajo deber de confidencialidad.
        </p>

        <h2 id="transferencias">6. Transferencias internacionales</h2>
        <p>
          Algunos proveedores pueden operar infraestructura fuera de la República Argentina. En esos casos puede existir
          transferencia internacional de datos. Procuramos que dichas transferencias se realicen con salvaguardas
          razonables (contratos, medidas técnicas y organizativas) y conforme normativa aplicable.
        </p>

        <h2 id="seguridad">7. Seguridad</h2>
        <p>
          Adoptamos medidas técnicas y organizativas orientadas a proteger la confidencialidad e integridad de los datos
          personales, en línea con <LegalRef>Ley 25.326, art. 9</LegalRef>. Estas medidas incluyen, según corresponda:
        </p>
        <ul>
          <li>Cifrado en tránsito (HTTPS/TLS) y controles de acceso por sesión/cuenta.</li>
          <li>Separación lógica por cuentas y políticas de autorización.</li>
          <li>Registro de auditoría y controles anti-abuso (p. ej. rate limiting).</li>
          <li>Buenas prácticas de desarrollo seguro (referencia a guías como OWASP).</li>
        </ul>
        <p>
          Ningún sistema es 100% infalible. En caso de incidentes, aplicaremos procedimientos razonables de contención,
          análisis y mejora.
        </p>

        <h2 id="retencion">8. Retención y eliminación</h2>
        <p>
          Conservamos datos mientras sean necesarios para prestar el servicio, cumplir obligaciones legales o resolver
          disputas. El Usuario puede solicitar eliminación de cuenta y/o datos, sujeto a retenciones mínimas necesarias
          (por ejemplo, evidencia asociada a documentos firmados) y a la normativa aplicable.
        </p>

        <h2 id="derechos">9. Derechos del titular</h2>
        <p>
          El titular de los datos puede ejercer derechos de acceso, rectificación, actualización y supresión, conforme Ley
          25.326. Para gestionar solicitudes, escribir a <a href="mailto:firmasimple@daslatam.org">firmasimple@daslatam.org</a>.
        </p>
		<p>
			La autoridad de aplicación y órgano de control de la Ley 25.326 es la <b>Agencia de Acceso a la Información Pública (AAIP)</b>.
			Podés realizar reclamos ante la AAIP cuando corresponda.
		</p>
        <p className="not-prose">
          <span className="inline-block rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
            Para uso del servicio y su encuadre legal, ver también los <Link className="underline" href="/terms">Términos y Condiciones</Link>.
          </span>
        </p>

        <h2 id="cookies">10. Cookies y analítica</h2>
        <p>
          Podemos utilizar cookies técnicas esenciales para mantener sesiones y seguridad. Si se incorporan herramientas de
          analítica, se informará su alcance y opciones de configuración cuando corresponda.
        </p>

        <h2 id="cambios">11. Cambios</h2>
        <p>
          Podemos actualizar esta política para reflejar cambios del servicio, mejoras de seguridad o nuevas obligaciones.
          Publicaremos la versión vigente en esta misma URL.
        </p>

        <h2 id="anexo">12. Anexo legal (extractos)</h2>
			<details>
			  <summary><b>Ley 25.326 – Artículo 5 (Consentimiento) – extracto</b></summary>
			  <pre>
{`ARTÍCULO 5° — (Consentimiento).
1. El tratamiento de datos personales es ilícito cuando el titular no hubiere prestado su consentimiento libre, expreso e informado, el que deberá constar por escrito, o por otro medio que permita se le equipare, de acuerdo a las circunstancias.

2. No será necesario el consentimiento cuando:
a) Los datos se obtengan de fuentes de acceso público irrestricto;
b) Se recaben para el ejercicio de funciones propias de los poderes del Estado o en virtud de una obligación legal;
c) Se trate de listados cuyos datos se limiten a nombre, documento nacional de identidad, identificación tributaria o previsional, ocupación, fecha de nacimiento y domicilio;
d) Deriven de una relación contractual, científica o profesional del titular de los datos, y resulten necesarios para su desarrollo o cumplimiento;
e) Se trate de las operaciones que realicen las entidades financieras y de las informaciones que reciban de sus clientes conforme las disposiciones del artículo 39 de la Ley 21.526.`}
			  </pre>
			</details>

		<details>
		  <summary><b>Ley 25.326 – Artículo 6 (Información)</b></summary>
		  <pre>
{`ARTÍCULO 6° — (Información).
Cuando se recaben datos personales se deberá informar previamente a sus titulares en forma expresa y clara:
a) La finalidad para la que serán tratados y quiénes pueden ser sus destinatarios o clase de destinatarios;
b) La existencia del archivo, registro, banco de datos, electrónico o de cualquier otro tipo, de que se trate y la identidad y domicilio de su responsable;
c) El carácter obligatorio o facultativo de las respuestas al cuestionario que se le proponga, en especial en cuanto a los datos referidos en el artículo siguiente;
d) Las consecuencias de proporcionar los datos, de la negativa a hacerlo o de la inexactitud de los mismos;
e) La posibilidad del interesado de ejercer los derechos de acceso, rectificación y supresión de los datos.`}
		  </pre>
		</details>
        <details>
          <summary><b>Ley 25.326 – Artículo 9 (Seguridad de los datos)</b></summary>
          <pre>
{`ARTÍCULO 9°.- (Seguridad de los datos).
1. El responsable o usuario del archivo de datos debe adoptar las medidas técnicas y organizativas que resulten necesarias para garantizar la seguridad y confidencialidad de los datos personales, de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan detectar desviaciones, intencionales o no, de información, ya sea que los riesgos provengan de la acción humana o del medio técnico utilizado.
2. Queda prohibido registrar datos personales en archivos, registros o bancos que no reúnan condiciones técnicas de integridad y seguridad.`}
          </pre>
        </details>
      </article>

      <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        Consultas: <a className="underline" href="mailto:firmasimple@daslatam.org">firmasimple@daslatam.org</a>
      </div>
    </div>
  );
}
