import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | FES",
  description: "Términos y condiciones de uso de Firma Electrónica Simple (FES).",
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-zinc-600">Última actualización: {UPDATED_AT}</p>

        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <b>Aviso importante:</b> FES implementa <b>firma electrónica</b> (Ley 25.506) y <b>NO</b> constituye firma digital
          certificada. La validez probatoria de la firma electrónica puede requerir prueba adicional cuando es desconocida.
        </div>
      </div>

      <div className="mb-10 rounded-xl border border-zinc-200 p-4">
        <div className="text-sm font-semibold text-zinc-900">Índice</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <TocLink href="#definiciones">1. Definiciones</TocLink>
          <TocLink href="#alcance-legal">2. Alcance legal</TocLink>
          <TocLink href="#cuenta-y-acceso">3. Cuenta, acceso y autenticación</TocLink>
          <TocLink href="#flujo">4. Funcionamiento del servicio</TocLink>
          <TocLink href="#evidencia">5. Evidencia técnica y auditoría</TocLink>
          <TocLink href="#obligaciones">6. Obligaciones del usuario</TocLink>
          <TocLink href="#prohibiciones">7. Prohibiciones y uso indebido</TocLink>
          <TocLink href="#disponibilidad">8. Disponibilidad, cambios y soporte</TocLink>
          <TocLink href="#responsabilidad">9. Limitación de responsabilidad</TocLink>
          <TocLink href="#datos">10. Datos personales y privacidad</TocLink>
          <TocLink href="#proveedores">11. Proveedores / subprocesadores</TocLink>
          <TocLink href="#jurisdiccion">12. Jurisdicción y ley aplicable</TocLink>
          <TocLink href="#anexos">13. Anexos normativos</TocLink>
        </div>
      </div>

      <article className="prose prose-zinc max-w-none leading-relaxed">
        <h2 id="definiciones">1. Definiciones</h2>
        <ul>
          <li>
            <b>FES</b>: el servicio web “Firma Electrónica Simple”, accesible desde el dominio oficial del producto.
          </li>
          <li>
            <b>Usuario</b>: la persona humana o jurídica que crea una cuenta y utiliza el servicio para solicitar firmas o
            administrar documentos.
          </li>
          <li>
            <b>Firmante</b>: persona que recibe una invitación para firmar/rechazar un documento. Puede firmar sin crear
            cuenta.
          </li>
          <li>
            <b>Documento</b>: archivo PDF cargado por el Usuario para firma, más sus metadatos, invitaciones y evidencias.
          </li>
          <li>
            <b>Firma electrónica</b>: la definida por la Ley 25.506, art. 5°.
          </li>
          <li>
            <b>Firma digital</b>: firma basada en certificado digital (infraestructura de firma digital). FES no presta ni
            reemplaza servicios de firma digital certificada.
          </li>
        </ul>

        <h2 id="alcance-legal">2. Alcance legal</h2>
        <p>
          FES está orientado a facilitar la firma de documentos mediante <b>firma electrónica</b> en la República Argentina.
          A efectos interpretativos, el servicio se apoya en normativa aplicable, incluyendo la Ley 25.506 (Firma Digital),
          el Código Civil y Comercial de la Nación (CCCN) y la Ley 25.326 (Protección de Datos Personales), sin perjuicio
          de normas complementarias.
        </p>
        <p>
          En particular, la Ley 25.506 define la firma electrónica y establece que, si la firma electrónica es desconocida,
          corresponde a quien la invoca acreditar su validez (<LegalRef>Ley 25.506, art. 5</LegalRef>). El CCCN dispone que,
          en instrumentos generados por medios electrónicos, el requisito de firma queda satisfecho si se utiliza firma
          digital (<LegalRef>CCCN, art. 288</LegalRef>), lo cual no impide el uso de firma electrónica, pero incide en su
          encuadre y carga probatoria.
        </p>
        <p>
          <b>El Usuario es responsable</b> de evaluar si el uso de firma electrónica es suficiente para el acto o trámite
          específico (por ejemplo, puede haber actos que requieran firma digital o formalidades incompatibles).
        </p>

        <h2 id="cuenta-y-acceso">3. Cuenta, acceso y autenticación</h2>
        <ul>
          <li>
            El acceso se realiza mediante mecanismos de autenticación (por ejemplo, enlace de acceso por email). El Usuario
            debe mantener control y confidencialidad sobre su casilla de correo, dispositivos y sesiones.
          </li>
          <li>
            El Usuario declara ser mayor de edad y tener capacidad para contratar, o actuar con representación suficiente.
          </li>
          <li>
            El servicio puede incluir modalidades de cuenta personal y cuenta empresa, y la selección de plan puede
            condicionar límites funcionales.
          </li>
        </ul>

        <h2 id="flujo">4. Funcionamiento del servicio</h2>
        <ol>
          <li>El Usuario carga un PDF y define firmantes (emails) e instrucciones.</li>
          <li>Los firmantes reciben una invitación con un enlace seguro y temporal.</li>
          <li>
            El firmante puede firmar (firma manuscrita capturada, aceptación de consentimiento y datos declarados) o
            rechazar.
          </li>
          <li>Se genera un PDF final y/o evidencia asociada, incluyendo auditoría y datos técnicos.</li>
        </ol>
        <p>
          FES puede incorporar funcionalidades en evolución (por ejemplo, redacción asistida y plantillas). Cuando se
          presenten como disponibles, se entenderán sujetas a cambios, mejoras o restricciones de plan.
        </p>

        <h2 id="evidencia">5. Evidencia técnica y auditoría</h2>
        <p>
          El objetivo de la evidencia técnica es facilitar la trazabilidad y la integridad del proceso. Entre otros, FES
          puede registrar:
        </p>
        <ul>
          <li>Hash de integridad del documento (por ejemplo, SHA-256) y/o del PDF final.</li>
          <li>Auditoría de eventos (creación, invitación, firma, rechazo, envíos, descargas) con timestamp.</li>
          <li>Datos técnicos del entorno del firmante (p. ej. IP y user-agent) como elementos de corroboración.</li>
          <li>Vínculo de verificación pública vía código/QR para consultar integridad y auditoría.</li>
        </ul>
        <p>
          La evidencia no constituye asesoramiento legal ni garantiza por sí sola la aceptación en todo procedimiento.
          Aun así, se diseña para aportar consistencia técnica y facilitar peritajes, verificaciones y corroboraciones.
        </p>

        <h3>5.1 Controles técnicos y medidas de seguridad</h3>
        <p>
          El servicio aplica un enfoque de “defensa en profundidad” basado en buenas prácticas. Sin perjuicio de la
          implementación concreta (que puede variar con el tiempo), el diseño contempla, entre otros:
        </p>
        <ul>
          <li>
            <b>Cifrado en tránsito:</b> comunicación mediante HTTPS/TLS provista por la plataforma de hosting.
          </li>
          <li>
            <b>Cifrado en reposo:</b> el almacenamiento subyacente provisto por el proveedor de base de datos/almacenamiento
            puede ofrecer cifrado en reposo (p. ej. AES-256).
          </li>
          <li>
            <b>Control de acceso:</b> separación por cuentas, sesiones autenticadas y políticas de autorización;
            restricciones adicionales para documentos/evidencia.
          </li>
          <li>
            <b>URLs firmadas temporales:</b> para descargas o visualización, con vencimiento.
          </li>
          <li>
            <b>Rate limiting y anti-abuso:</b> límites y controles para mitigar automatización abusiva y ataques.
          </li>
          <li>
            <b>Registro de auditoría:</b> eventos relevantes con marca de tiempo y atributos técnicos.
          </li>
        </ul>
        <p>
          Estas medidas se complementan con prácticas de desarrollo seguro y referencia a estándares y guías (por ejemplo,
          OWASP) como marco de trabajo. Esto no implica que el servicio cuente con certificaciones formales propias.
        </p>

        <h3>5.2 Verificación y detección de alteraciones</h3>
        <p>
          La verificación pública (código/QR) está orientada a detectar inconsistencias entre el archivo presentado y el
          registro de integridad/auditoría. Ante discrepancias, el resultado debe ser considerado como alerta de posible
          alteración, corrupción del archivo o procedimiento fuera del flujo normal.
        </p>

        <h2 id="obligaciones">6. Obligaciones del usuario</h2>
        <ul>
          <li>Usar el servicio conforme a ley, buena fe y estos términos.</li>
          <li>Contar con derechos suficientes sobre el documento (p. ej. titularidad, autorización o licencia).</li>
          <li>
            Informar adecuadamente a firmantes sobre el contenido y alcance del documento, y obtener consentimientos que
            correspondan.
          </li>
          <li>
            No cargar información ilícita, sensible o restringida sin base legal y sin medidas apropiadas (p. ej. secretos
            profesionales, datos de terceros sin legitimación, etc.).
          </li>
        </ul>

        <h2 id="prohibiciones">7. Prohibiciones y uso indebido</h2>
        <p>Está prohibido, entre otros:</p>
        <ul>
          <li>Suplantar identidad, falsear datos, o intentar manipular auditorías/evidencias.</li>
          <li>Usar el servicio para fraude, phishing, spam, malware o ingeniería social.</li>
          <li>Acceder o intentar acceder a datos de terceros, cuentas o documentos sin autorización.</li>
          <li>Uso abusivo que afecte la disponibilidad (automatización agresiva, scraping, etc.).</li>
        </ul>

        <h2 id="disponibilidad">8. Disponibilidad, cambios y soporte</h2>
        <ul>
          <li>
            El servicio se presta “tal cual” y puede estar sujeto a mantenimientos, interrupciones o degradaciones
            temporales.
          </li>
          <li>
            Podemos modificar la UI, flujos, límites, y funcionalidades para mejorar seguridad, rendimiento o cumplimiento.
          </li>
          <li>
            El Usuario es responsable de conservar copias de documentos finales y evidencia que requiera para su operación.
          </li>
        </ul>

        <h2 id="responsabilidad">9. Limitación de responsabilidad</h2>
        <p>
          En la máxima medida permitida por la normativa aplicable, FES no será responsable por daños indirectos,
          incidentales, especiales o consecuenciales, pérdida de chance o lucro cesante, derivados del uso o imposibilidad
          de uso del servicio.
        </p>
        <p>
          El Usuario reconoce que la valoración jurídica y probatoria de la firma electrónica depende del caso, del tipo de
          acto, de la conducta de las partes y de la eventual prueba (incluida pericial informática) que pudiera requerirse.
        </p>

        <h2 id="datos">10. Datos personales y privacidad</h2>
        <p>
          El tratamiento de datos personales se rige por la <Link href="/privacy">Política de Privacidad</Link>. La Ley
          25.326 exige adoptar medidas de seguridad para evitar tratamiento no autorizado (<LegalRef>Ley 25.326, art. 9</LegalRef>).
        </p>

        <h2 id="proveedores">11. Proveedores / subprocesadores</h2>
        <p>
          Para operar, FES puede utilizar proveedores de infraestructura y servicios (por ejemplo: hosting, base de datos,
          envío de emails, rate limiting). En el marco de un modelo de responsabilidad compartida, dichos proveedores
          brindan controles y medidas de seguridad a nivel plataforma.
        </p>
        <ul>
          <li>
            Hosting / edge: Vercel (seguridad y cumplimiento: <a href="https://vercel.com/docs/security/compliance" target="_blank" rel="noreferrer">Compliance</a>).
          </li>
          <li>
            Base de datos / almacenamiento / autenticación: Supabase (seguridad: <a href="https://supabase.com/security" target="_blank" rel="noreferrer">Security</a>).
          </li>
          <li>
            Envío de emails: Resend (seguridad: <a href="https://resend.com/docs/security" target="_blank" rel="noreferrer">Security</a>).
          </li>
          <li>
            Rate limiting / colas: Upstash (compliance: <a href="https://upstash.com/docs/common/help/compliance" target="_blank" rel="noreferrer">Compliance</a>).
          </li>
        </ul>
        <p>
          Los estándares o certificaciones mencionados en sitios de terceros corresponden a dichos proveedores y no deben
          interpretarse como certificación del servicio FES en sí mismo.
        </p>
        <p>
          Más detalle, incluyendo finalidades y transferencias, en la Política de Privacidad.
        </p>

        <h2 id="jurisdiccion">12. Jurisdicción y ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a los
          tribunales ordinarios competentes de la Ciudad Autónoma de Buenos Aires, salvo norma imperativa en contrario.
        </p>

        <h2 id="anexos">13. Anexos normativos</h2>
        <p>
          A continuación se transcriben artículos relevantes como referencia interpretativa. Ante diferencias con textos
          oficiales/actualizados, prevalecen las fuentes oficiales.
        </p>

        <details>
          <summary><b>Ley 25.506 – Artículos 5 a 6 (extracto)</b></summary>
          <pre>
{`ARTÍCULO 5º — Firma electrónica.
Se entiende por firma electrónica al conjunto de datos electrónicos integrados, ligados o asociados de manera lógica a otros datos electrónicos, utilizado por el signatario como su medio de identificación, que carezca de alguno de los requisitos legales para ser considerada firma digital. En caso de ser desconocida la firma electrónica corresponde a quien la invoca acreditar su validez.

ARTÍCULO 6º — Documento digital.
Se entiende por documento digital a la representación digital de actos o hechos, con independencia del soporte utilizado para su fijación, almacenamiento o archivo. Un documento digital también satisface el requerimiento de escritura.`}
          </pre>
        </details>

        <details>
          <summary><b>CCCN – Artículo 288 (extracto)</b></summary>
          <pre>
{`ARTÍCULO 288.- Firma.
La firma prueba la autoría de la declaración de voluntad expresada en el texto al cual corresponde. Debe consistir en el nombre del firmante o en un signo.

En los instrumentos generados por medios electrónicos, el requisito de la firma de una persona queda satisfecho si se utiliza una firma digital, que asegure indubitablemente la autoría e integridad del instrumento.`}
          </pre>
        </details>

        <details>
          <summary><b>Ley 25.326 – Artículo 9 (extracto)</b></summary>
          <pre>
{`ARTÍCULO 9°.- (Seguridad de los datos).
1. El responsable o usuario del archivo de datos debe adoptar las medidas técnicas y organizativas que resulten necesarias para garantizar la seguridad y confidencialidad de los datos personales, de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan detectar desviaciones, intencionales o no, de información, ya sea que los riesgos provengan de la acción humana o del medio técnico utilizado.
2. Queda prohibido registrar datos personales en archivos, registros o bancos que no reúnan condiciones técnicas de integridad y seguridad.`}
          </pre>
        </details>

        <p>
          Fuentes oficiales recomendadas: normativa nacional en <a href="https://www.argentina.gob.ar/normativa" target="_blank" rel="noreferrer">Argentina.gob.ar</a> e InfoLEG.
        </p>
      </article>

      <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        Consultas: <a className="underline" href="mailto:firmasimple@daslatam.org">firmasimple@daslatam.org</a>
      </div>
    </div>
  );
}
