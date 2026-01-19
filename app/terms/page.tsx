import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Términos y Condiciones</h1>
      <p className="mt-3 text-sm text-zinc-600">
        Última actualización: {new Date().toISOString().slice(0, 10)}.
      </p>

      <div className="prose prose-zinc mt-8 max-w-none">
        <h2>1. Alcance del servicio</h2>
        <p>
          Firma Digital Simple ("FDS") brinda una herramienta de firma electrónica para documentos en formato PDF. 
          El servicio permite invitar firmantes, capturar la firma manuscrita mediante trazo y generar un PDF final con evidencia.
        </p>

        <h2>2. Marco normativo</h2>
        <ul>
          <li>Ley 25.506 (Firma Digital): se utiliza el esquema de <strong>firma electrónica</strong> (art. 5) y no un certificado de firma digital (art. 2).
          </li>
          <li>Código Civil y Comercial de la Nación: reglas de instrumentos particulares y firma (arts. 286, 287, 288 y concordantes).</li>
          <li>Ley 25.326 (Protección de Datos Personales) y normativa complementaria.</li>
        </ul>
        <p>
          El usuario acepta que, según el tipo de acto jurídico, jurisdicción y prueba, la eficacia probatoria puede variar. FDS aporta evidencia técnica y trazabilidad.
        </p>

        <h2>3. Evidencia técnica</h2>
        <p>
          Para cada documento y firma, el sistema registra eventos y evidencia, incluyendo: hash SHA-256 del PDF original, fecha y hora, dirección IP, user-agent, y datos identificatorios ingresados por el firmante.
          El PDF final incorpora una constancia de evidencia con la información relevante.
        </p>

        <h2>4. Requisitos de identificación y consentimiento</h2>
        <p>
          Por razones de seguridad, el firmante debe informar: nombre y apellido, DNI, CUIL, domicilio postal y número de celular. Para empresas se requiere CUIT y datos del representante.
          Asimismo, el firmante debe manifestar su consentimiento antes de enviar la firma.
        </p>

        <h2>5. Uso gratuito y suscripciones</h2>
        <p>
          Firmar siempre es gratuito. Para subir documentos, se ofrece un cupo gratuito semanal y planes por volumen. Los precios y condiciones se detallan en <Link href="/pricing">Planes</Link>.
        </p>

        <h2>6. Retención y disponibilidad</h2>
        <p>
          Por políticas de seguridad y trazabilidad, la evidencia y documentos pueden conservarse hasta por 10 años. El acceso se limita a las partes autorizadas y se disponibiliza a terceros únicamente ante orden judicial o requerimiento legal aplicable.
        </p>

        <h2>7. Limitación de responsabilidad</h2>
        <p>
          El servicio se brinda "tal cual". FDS no revisa el contenido de los documentos ni garantiza su validez jurídica en todos los casos. El usuario es responsable del contenido y del uso del servicio.
        </p>

        <h2>8. Jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a los tribunales competentes.
        </p>
      </div>
    </div>
  );
}
