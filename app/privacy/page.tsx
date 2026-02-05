import Link from "next/link";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900">
      {children}
    </a>
  );
}

export default function PrivacyPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold">Política de Privacidad</h1>
        <p className="text-sm text-zinc-600">Última actualización: {updated}.</p>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
          Tratamos datos personales y evidencia de firma (incluye datos identificatorios y trazo manuscrito). Aplican principios de la Ley 25.326. Conservamos evidencia hasta 10 años por seguridad y trazabilidad.
        </div>
      </div>

      <div className="prose prose-zinc mt-8 max-w-none">
        <h2>1. Normativa</h2>
        <p>
          Esta política se interpreta principalmente conforme a la <b>Ley 25.326</b> (Protección de Datos Personales) y normativa complementaria.
          Texto oficial: <ExternalLink href="https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790">Argentina.gob.ar (InfoLEG)</ExternalLink>.
        </p>

        <h2>2. Qué datos recolectamos</h2>
        <ul>
          <li><b>Cuenta:</b> email, identificador de usuario.</li>
          <li><b>Identidad declarada:</b> nombre completo, DNI, CUIL, domicilio y celular (obligatorio antes del uso).</li>
          <li><b>Empresas (si aplica):</b> CUIT, razón social y datos del representante.</li>
          <li><b>Evidencia de firma:</b> trazo manuscrito (firma capturada), hash de documentos, timestamps y auditoría por evento.</li>
          <li><b>Datos técnicos:</b> IP, user-agent, timestamps, identificadores de sesión y logs de seguridad.</li>
        </ul>

        <h2>3. Finalidades</h2>
        <ul>
          <li>Prestar el servicio de firma y generar documentos finales con evidencia.</li>
          <li>Seguridad, prevención de fraude y abuso (rate limiting, monitoreo).</li>
          <li>Auditoría y trazabilidad (registro forense) asociada a cada documento.</li>
          <li>Cumplimiento legal y respuesta a requerimientos válidos.</li>
        </ul>

        <h2>4. Base legal y consentimiento</h2>
        <p>
          El tratamiento se realiza con base en el consentimiento del usuario y/o la necesidad de ejecutar el servicio solicitado.
          Para firmar, el firmante debe aceptar un consentimiento informado y declarar sus datos identificatorios.
        </p>

        <h2>5. Retención: 10 años</h2>
        <p>
          Por razones de seguridad, trazabilidad y potenciales controversias, conservamos documentos y evidencia por hasta <b>10 años</b>.
          Luego de ese plazo, podremos anonimizar o eliminar datos según corresponda.
        </p>

        <h2>6. Acceso y compartición</h2>
        <p>
          No vendemos datos personales. Compartimos datos únicamente con proveedores necesarios para operar el servicio (por ejemplo, almacenamiento y correo)
          y bajo acuerdos de confidencialidad y seguridad.
        </p>
        <p>
          Podemos disponibilizar información a terceros sólo ante <b>orden judicial</b> o requerimiento legal aplicable.
        </p>

        <h2>7. Seguridad</h2>
        <ul>
          <li>Bucket de almacenamiento privado, acceso mediante credenciales server-side (admin client).</li>
          <li>Hash SHA-256 y sello de evidencia incorporado al PDF final.</li>
          <li>Auditoría por evento y logs para investigación forense.</li>
          <li>Controles de abuso (rate limiting) y validaciones del lado servidor.</li>
        </ul>

        <h2>8. Derechos del titular</h2>
        <p>
          Podés solicitar acceso, rectificación o actualización de tus datos. Para ello, escribinos por los canales de soporte.
        </p>
        <p>
          También podés actualizar tu información desde la sección <Link href="/profile">Perfil</Link>.
        </p>

        <h2>9. Cambios</h2>
        <p>
          Podemos actualizar esta política. La fecha de última actualización se muestra al inicio.
        </p>
      </div>
    </div>
  );
}
