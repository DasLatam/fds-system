import Link from "next/link";

export const dynamic = "force-dynamic";

const UPDATED_AT = "2026-02-07";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl font-semibold text-zinc-900">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-base font-semibold text-zinc-900">{children}</h3>;
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Política de privacidad</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: <span className="font-medium text-zinc-800">{UPDATED_AT}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          Esta Política explica qué datos tratamos cuando usás Firma Electrónica Simple (FES), para qué los usamos y qué opciones tenés.
          El objetivo es ser claros y prácticos: si algo no se entiende, escribinos.
        </p>
      </div>

      <SectionTitle>1. Alcance y roles</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Esta Política aplica al uso del Servicio (web y APIs). En general:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>
          FES actúa como proveedor del Servicio y trata datos necesarios para operar la plataforma.
        </li>
        <li>
          En documentos entre partes, es posible que el Usuario que crea el documento sea quien define el contenido y los firmantes.
        </li>
      </ul>

      <SectionTitle>2. Qué datos recopilamos</SectionTitle>
      <SubTitle>2.1. Datos de cuenta y perfil</SubTitle>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Email (para acceso y notificaciones).</li>
        <li>Nombre y datos de identificación que el Usuario cargue en su perfil (por ejemplo: DNI/CUIL, dirección, teléfono).</li>
        <li>Preferencias básicas del Servicio y estado de cuenta.</li>
      </ul>

      <SubTitle>2.2. Datos de documentos y firmas</SubTitle>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Contenido del documento que el Usuario sube o redacta.</li>
        <li>Datos que completan los firmantes en formularios (por ejemplo: nombre, documento, aclaración, etc.).</li>
        <li>Archivos PDF generados o subidos y su versión final.</li>
      </ul>

      <SubTitle>2.3. Datos técnicos y de uso</SubTitle>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Registros de auditoría del flujo de firma (por ejemplo: invitación, apertura, firma, finalización).</li>
        <li>Metadatos técnicos habituales (por ejemplo: fecha/hora, navegador/dispositivo, dirección IP reportada, identificadores técnicos).</li>
        <li>Cookies o almacenamiento local necesarios para sesión y funcionamiento básico.</li>
      </ul>

      <SectionTitle>3. Para qué usamos los datos</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">Usamos los datos para:</p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Proveer el Servicio: crear documentos, invitar firmantes, generar PDFs y mostrar estados.</li>
        <li>Autenticación y seguridad: validar acceso por email, prevenir fraude y abuso.</li>
        <li>Notificaciones: enviar Magic Links y emails transaccionales (invitación, recordatorios, documento final).</li>
        <li>Mejoras del producto: diagnósticos, métricas agregadas y mejoras de UX (cuando corresponda).</li>
        <li>Cumplimiento: responder requerimientos legales válidos y proteger derechos/seguridad de usuarios.</li>
      </ul>

      <SectionTitle>4. Base legal y consentimiento</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Tratamos datos principalmente para ejecutar el Servicio que solicitás (relación contractual) y por interés legítimo en seguridad y estabilidad.
        Cuando la ley lo requiera, pediremos consentimiento. Podés retirar tu consentimiento en cualquier momento, aunque eso puede limitar el uso del Servicio.
      </p>

      <SectionTitle>5. Cómo compartimos datos</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        No vendemos tu información personal. Podemos compartir datos con proveedores que nos ayudan a operar el Servicio, por ejemplo:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Infraestructura y base de datos (p. ej., Supabase).</li>
        <li>Hosting y entrega (p. ej., Vercel).</li>
        <li>Envío de emails transaccionales (p. ej., Resend).</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Estos proveedores actúan como encargados y están autorizados a tratar datos solo para prestar sus servicios.
      </p>

      <SectionTitle>6. Transferencias internacionales</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Dependiendo de la infraestructura utilizada, los datos pueden almacenarse o procesarse en servidores ubicados fuera de Argentina.
        Cuando aplica, buscamos utilizar proveedores con prácticas razonables de seguridad y acuerdos contractuales apropiados.
      </p>

      <SectionTitle>7. Conservación y eliminación</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Conservamos datos el tiempo necesario para operar el Servicio y cumplir obligaciones legales o resolver disputas.
        En términos generales:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Datos de cuenta: mientras mantengas una cuenta activa o hasta que solicites eliminación, sujeto a retenciones legales mínimas.</li>
        <li>Documentos y PDFs: mientras estén disponibles en tu cuenta o hasta que solicites su eliminación, sujeto a limitaciones técnicas o legales.</li>
        <li>Auditoría y seguridad: por un período razonable para prevenir fraude y mantener trazabilidad.</li>
      </ul>

      <SectionTitle>8. Seguridad</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Implementamos medidas de seguridad razonables para proteger la información, incluyendo cifrado en tránsito (HTTPS/TLS), controles de acceso y validaciones.
        Ningún sistema es 100% infalible: también es importante que cuides tu email, tus enlaces y tus dispositivos.
      </p>

      <SectionTitle>9. Derechos de las personas usuarias</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Podés solicitar acceso, rectificación, actualización o eliminación de tus datos, y oponerte o limitar ciertos tratamientos.
        En Argentina, estos derechos se enmarcan en la Ley 25.326 y normativa complementaria.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Acceso: conocer qué datos tenemos sobre vos.</li>
        <li>Rectificación/actualización: corregir datos inexactos.</li>
        <li>Eliminación: solicitar borrado, cuando sea aplicable.</li>
        <li>Oposición/limitación: en ciertos supuestos.</li>
      </ul>

      <SectionTitle>10. Emails y comunicaciones</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Enviamos emails transaccionales indispensables para el funcionamiento (Magic Links, invitaciones y documento final). Podés dejar de recibir comunicaciones
        no esenciales cuando exista esa opción, pero los emails operativos pueden continuar mientras uses el Servicio.
      </p>

      <SectionTitle>11. Cambios a esta Política</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Podemos actualizar esta Política para reflejar cambios del Servicio, legales o de seguridad. Publicaremos la versión vigente en este sitio.
      </p>

      <SectionTitle>12. Contacto</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Para ejercer derechos o consultas de privacidad, contactanos a través de los canales disponibles en el Servicio.
        También podés revisar los términos:
      </p>
      <p className="mt-3 text-sm">
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/terms">
          Ver Términos y Condiciones
        </Link>
      </p>

      <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold text-zinc-900">Glosario rápido</div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          <span className="font-medium">Datos de auditoría</span>: eventos y metadatos del proceso de firma.
          <br />
          <span className="font-medium">Encargados</span>: proveedores que procesan datos para operar el Servicio.
          <br />
          <span className="font-medium">Magic Link</span>: enlace de acceso por email (sin contraseña).
        </p>
      </div>
    </div>
  );
}
