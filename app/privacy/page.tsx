import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Política de Privacidad</h1>
      <p className="mt-3 text-sm text-zinc-600">
        Última actualización: {new Date().toISOString().slice(0, 10)}.
      </p>

      <div className="prose prose-zinc mt-8 max-w-none">
        <p>
          Esta Política describe cómo recolectamos, utilizamos y protegemos datos personales en el servicio “Firma Digital Simple” (el “Servicio”)
          y se interpreta conforme a la normativa aplicable en Argentina, en particular la Ley 25.326 de Protección de Datos Personales y normas complementarias.
        </p>
        <h2>Datos que recolectamos</h2>
        <ul>
          <li><strong>De firmantes:</strong> nombre completo, DNI, CUIL, domicilio, celular y firma manuscrita (trazo), además de metadatos técnicos (IP, user-agent, fecha y hora).</li>
          <li><strong>De cuentas Empresa:</strong> razón social, CUIT, domicilio y datos del representante.</li>
          <li><strong>De uso:</strong> registros de auditoría, eventos de acceso, y datos necesarios para prevención de abuso (rate limiting).</li>
        </ul>
        <h2>Finalidades</h2>
        <ul>
          <li>Operar el Servicio (subida, invitación, firma y descarga de documentos).</li>
          <li>Generar evidencia técnica (hash SHA-256, timestamps, IP) para mejorar la trazabilidad.</li>
          <li>Seguridad, prevención de fraude y cumplimiento de obligaciones legales.</li>
        </ul>
        <h2>Retención</h2>
        <p>
          Por motivos de seguridad y trazabilidad, conservamos documentos y registros asociados por un plazo de <strong>10 años</strong>.
          Este plazo puede extenderse si existe obligación legal o necesidad de resguardo ante controversias.
        </p>
        <h2>Acceso y divulgación</h2>
        <p>
          Solo el titular de la cuenta creadora y las partes firmantes podrán acceder a los documentos firmados y su evidencia.
          La divulgación a terceros se realizará únicamente ante <strong>orden judicial</strong> o exigencia legal válida.
        </p>
        <h2>Seguridad</h2>
        <ul>
          <li>Almacenamiento privado en Supabase Storage y acceso por URLs firmadas.</li>
          <li>Uso de hash SHA-256 para integridad del documento.</li>
          <li>Registro de auditoría por evento (apertura, visualización, firma, envío de correo).</li>
          <li>Rate limiting con Upstash Redis para mitigar abuso.</li>
        </ul>
        <h2>Derechos del titular</h2>
        <p>
          Podés solicitar acceso, rectificación o actualización de tus datos personales conforme a la Ley 25.326.
          Para ejercer tus derechos, contactanos a través de los canales indicados en los Términos.
        </p>
        <h2>Contacto</h2>
        <p>
          Ver <Link href="/terms">Términos y Condiciones</Link> para canales de contacto.
        </p>
      </div>
    </div>
  );
}
