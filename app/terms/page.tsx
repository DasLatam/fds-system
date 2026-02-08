import Link from "next/link";

export const dynamic = "force-dynamic";

const UPDATED_AT = "2026-02-07";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xl font-semibold text-zinc-900">{children}</h2>;
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-base font-semibold text-zinc-900">{children}</h3>;
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Términos y condiciones</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Última actualización: <span className="font-medium text-zinc-800">{UPDATED_AT}</span>
        </p>
        <p className="mt-4 text-sm leading-relaxed text-zinc-700">
          Estos Términos y Condiciones (los “Términos”) regulan el uso de <span className="font-medium">Firma Electrónica Simple (FES)</span>
          (el “Servicio”). Al acceder o utilizar el Servicio, aceptás estos Términos. Si no estás de acuerdo, no utilices el Servicio.
        </p>
      </div>

      <SectionTitle>1. Alcance del Servicio</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        FES permite crear documentos, invitar firmantes y registrar evidencia del proceso de firma para generar un PDF final.
        El Servicio está orientado a la <span className="font-medium">firma electrónica</span> conforme la Ley 25.506 (República Argentina).
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>
          <span className="font-medium">Firma electrónica</span>: mecanismo de identificación y consentimiento que se apoya en evidencia técnica y trazabilidad.
        </li>
        <li>
          <span className="font-medium">No es firma digital certificada</span>: FES no reemplaza certificados emitidos por certificadores licenciados.
        </li>
        <li>
          <span className="font-medium">Uso típico</span>: acuerdos, autorizaciones, conformidades, consentimientos, documentos internos y anexos.
        </li>
      </ul>

      <SectionTitle>2. Definiciones</SectionTitle>
      <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <ul className="space-y-2 text-sm text-zinc-700">
          <li>
            <span className="font-medium">Usuario</span>: persona que crea documentos, administra una cuenta o utiliza el Servicio.
          </li>
          <li>
            <span className="font-medium">Firmante</span>: persona invitada a firmar un documento.
          </li>
          <li>
            <span className="font-medium">Cuenta</span>: contexto de uso (personal o de empresa) asociado a un plan y límites.
          </li>
          <li>
            <span className="font-medium">Magic Link</span>: enlace de acceso enviado por email, usualmente de un solo uso y con validez temporal.
          </li>
          <li>
            <span className="font-medium">Evidencia / auditoría</span>: registro de eventos y metadatos del flujo de firma (por ejemplo: invitación, apertura, firma, finalización).
          </li>
        </ul>
      </div>

      <SectionTitle>3. Registro, acceso y cuenta</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Para ingresar, el Servicio puede utilizar un flujo sin contraseña (“Magic Link”). El acceso se vincula al email.
        Sos responsable de mantener el control de tu casilla de correo y de cualquier sesión iniciada.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>No compartas enlaces de acceso ni enlaces de firma.</li>
        <li>Si sospechás acceso no autorizado, cerrá sesión y solicitá un nuevo Magic Link.</li>
        <li>Podemos pedir información adicional para prevenir abuso o actividades fraudulentas.</li>
      </ul>

      <SectionTitle>4. Uso permitido y responsabilidades</SectionTitle>
      <SubTitle>4.1. Conducta y contenido</SubTitle>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        Te comprometés a utilizar el Servicio de forma lícita y a no cargar o distribuir contenido ilegal, infractor, engañoso o que viole derechos de terceros.
        El Servicio no está destinado a actividades que requieran validaciones regulatorias específicas.
      </p>
      <SubTitle>4.2. Identidad y datos</SubTitle>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        La validez probatoria de un proceso de firma depende, entre otros factores, de la consistencia de la evidencia, el contexto y la información aportada.
        Sos responsable de:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Ingresar datos reales y actuales en tu perfil y al completar formularios de firma.</li>
        <li>Verificar, cuando corresponda, la identidad del firmante por medios propios (por ejemplo, documentación, validaciones internas, etc.).</li>
        <li>Definir el nivel de formalidad adecuado para cada documento y su caso de uso.</li>
      </ul>

      <SectionTitle>5. Evidencia del proceso y PDF final</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        El Servicio registra un historial del flujo de firma para respaldar el documento. Sin perjuicio de mejoras futuras, la evidencia puede incluir, entre otros:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Marca temporal de eventos (invitación, apertura, firma, finalización).</li>
        <li>Identificadores técnicos del documento (por ejemplo, hashes) y del enlace de firma.</li>
        <li>Metadatos básicos de la interacción (por ejemplo, navegador/dispositivo y dirección IP reportada).</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Al completarse todas las firmas, se genera un PDF final. El documento final puede incluir un código o referencia de auditoría para consulta.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Importante: FES provee herramientas y evidencia técnica, pero no reemplaza asesoramiento legal. La valoración probatoria corresponde a las autoridades competentes y depende del caso concreto.
      </p>

      <SectionTitle>6. Planes, límites y cambios</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        El Servicio puede ofrecer distintos planes (por ejemplo, gratuito, individual y empresa) con límites y funcionalidades.
        Los límites suelen aplicarse a la <span className="font-medium">creación</span> de documentos por mes y por cuenta activa.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Los precios y beneficios pueden cambiar con aviso razonable.</li>
        <li>Podemos introducir planes por volumen o acuerdos comerciales para organizaciones.</li>
        <li>El abuso del Servicio puede derivar en restricciones, suspensión o cancelación.</li>
      </ul>

      <SectionTitle>7. Seguridad y disponibilidad</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Aplicamos buenas prácticas para proteger el Servicio y la información procesada. En particular:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        <li>Usamos cifrado en tránsito (HTTPS/TLS) para la comunicación con el Servicio.</li>
        <li>Implementamos controles de acceso y validaciones para reducir riesgos de uso indebido.</li>
        <li>Podemos limitar solicitudes (rate limiting) y aplicar medidas antifraude.</li>
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        El Servicio se brinda “tal cual” y “según disponibilidad”. Podemos realizar mantenimiento, cambios y mejoras que temporalmente afecten la disponibilidad.
      </p>

      <SectionTitle>8. Propiedad intelectual</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        El software, marca, diseño y materiales del Servicio son propiedad del proveedor del Servicio o de sus licenciantes.
        Vos conservás los derechos sobre el contenido que subas o generes (documentos), y nos otorgás una licencia limitada para procesarlo únicamente
        con el fin de prestar el Servicio.
      </p>

      <SectionTitle>9. Limitación de responsabilidad</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        En la medida permitida por la ley, el proveedor del Servicio no será responsable por daños indirectos, lucro cesante, pérdida de datos o interrupciones
        derivadas del uso o imposibilidad de uso del Servicio. La responsabilidad total, de corresponder, se limitará al monto efectivamente abonado por el Usuario
        por el Servicio en un período razonable previo al reclamo.
      </p>

      <SectionTitle>10. Suspensión y terminación</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Podemos suspender o terminar el acceso al Servicio si detectamos uso abusivo, violaciones a estos Términos o requerimientos legales.
        También podés dejar de usar el Servicio en cualquier momento.
      </p>

      <SectionTitle>11. Modificaciones de estos Términos</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Podemos actualizar estos Términos para reflejar cambios del Servicio, legales o de seguridad. Publicaremos la versión vigente en este sitio.
        El uso continuado del Servicio implica aceptación de los cambios.
      </p>

      <SectionTitle>12. Contacto</SectionTitle>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        Para consultas generales, privacidad o reclamos, podés contactarnos a través de los canales disponibles en el Servicio.
        También podés revisar la política de privacidad:
      </p>
      <p className="mt-3 text-sm">
        <Link className="font-medium text-emerald-700 hover:text-emerald-800" href="/privacy">
          Ver Política de Privacidad
        </Link>
      </p>

      <div className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold text-zinc-900">Glosario rápido</div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          <span className="font-medium">Magic Link</span>: enlace que llega por email para acceder o firmar sin contraseña.
          <br />
          <span className="font-medium">Auditoría</span>: historial del proceso que ayuda a respaldar el documento.
          <br />
          <span className="font-medium">Cuenta activa</span>: cuenta (personal/empresa) cuyo plan y límites aplican en el momento.
        </p>
      </div>
    </div>
  );
}
