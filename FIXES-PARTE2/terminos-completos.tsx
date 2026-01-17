import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="mb-8">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
              ← Volver al Inicio
            </Link>
            <h1 className="text-4xl font-bold mb-4">Términos y Condiciones</h1>
            <p className="text-gray-600">
              FDS - Firma Digital Simple | Última actualización: Enero 2026
            </p>
          </div>

          <div className="prose max-w-none space-y-6">
            {/* 1. Introducción */}
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introducción y Aceptación</h2>
              <p className="text-gray-700 leading-relaxed">
                Los presentes Términos y Condiciones (en adelante, los "Términos") regulan el uso de la plataforma 
                FDS - Firma Digital Simple (en adelante, "FDS" o la "Plataforma"), operada por DasLATAM 
                (en adelante, el "Prestador" o "Nosotros").
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Al acceder, registrarse o utilizar la Plataforma, el Usuario (en adelante, "Usted" o el "Usuario") 
                acepta estar vinculado por estos Términos y por nuestra Política de Privacidad. Si no está de acuerdo 
                con estos Términos, no debe utilizar la Plataforma.
              </p>
            </section>

            {/* 2. Marco Legal */}
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Marco Legal Aplicable</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1. Ley 25.506 de Firma Digital</h3>
              <p className="text-gray-700 leading-relaxed">
                FDS opera en cumplimiento estricto con la <strong>Ley 25.506 de Firma Digital</strong> de la República Argentina.
              </p>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 2 - Firma digital</p>
                <p className="text-sm text-gray-700 italic">
                  "Se entiende por firma digital al resultado de aplicar a un documento digital un procedimiento 
                  matemático que requiere información de exclusivo conocimiento del firmante, encontrándose ésta 
                  bajo su absoluto control. La firma digital debe ser susceptible de verificación por terceras partes, 
                  tal que dicha verificación simultáneamente permita identificar al firmante y detectar cualquier 
                  alteración del documento digital posterior a su firma."
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 5 - Presunción de autoría</p>
                <p className="text-sm text-gray-700 italic">
                  "La firma digital, cuando se hubiesen cumplido los requisitos de forma y de validez previstos en 
                  esta ley, tiene, respecto de los datos en formato digital, los mismos efectos jurídicos que la 
                  firma ológrafa en relación con los documentos escritos en soporte de papel."
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 7 - Presunción de integridad</p>
                <p className="text-sm text-gray-700 italic">
                  "Si el resultado de un procedimiento de verificación de una firma digital es verdadero, se presume, 
                  salvo prueba en contrario, que el documento digital no ha sido modificado desde el momento de su firma."
                </p>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 48 - Valor probatorio</p>
                <p className="text-sm text-gray-700 italic">
                  "Los documentos electrónicos firmados digitalmente y los reproducidos en formato digital firmados 
                  digitalmente a partir de originales de primera generación en cualquier otro soporte, también tendrán 
                  valor probatorio, conforme a lo previsto en esta ley."
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2. Código Civil y Comercial de la Nación</h3>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 286 - Expresión escrita</p>
                <p className="text-sm text-gray-700 italic">
                  "La expresión escrita puede tener lugar por instrumentos públicos, o por instrumentos particulares 
                  firmados o no firmados, excepto en los casos en que determinada instrumentación sea impuesta. Puede 
                  hacerse constar en cualquier soporte, siempre que su contenido sea representado con texto inteligible, 
                  aunque su lectura exija medios técnicos."
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 287 - Firma</p>
                <p className="text-sm text-gray-700 italic">
                  "La firma prueba la autoría de la declaración de voluntad expresada en el texto al cual corresponde. 
                  Debe consistir en el nombre del firmante o en un signo. En los instrumentos generados por medios 
                  electrónicos, el requisito de la firma de una persona queda satisfecho si se utiliza una firma digital, 
                  que asegure indubitablemente la autoría e integridad del instrumento."
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 288 - Instrumentos privados y particulares no firmados</p>
                <p className="text-sm text-gray-700 italic">
                  "Los instrumentos particulares pueden estar firmados o no. Si lo están, se llaman instrumentos privados. 
                  Si no lo están, se los denomina instrumentos particulares no firmados; esta categoría comprende todo 
                  escrito no firmado, entre otros, los impresos, los registros visuales o auditivos de cosas o hechos 
                  y, cualquiera que sea el medio empleado, los registros de la palabra y de información."
                </p>
              </div>
            </section>

            {/* 3. Servicios */}
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Descripción de los Servicios</h2>
              <p className="text-gray-700 leading-relaxed">
                FDS proporciona una plataforma tecnológica que permite a los Usuarios:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Cargar documentos en formato PDF para ser firmados digitalmente</li>
                <li>Invitar a múltiples firmantes a firmar documentos</li>
                <li>Realizar firmas digitales con validez legal según la Ley 25.506</li>
                <li>Almacenar documentos firmados de forma segura</li>
                <li>Generar evidencia forense de cada firma (timestamp, IP, metadata)</li>
                <li>Gestionar el ciclo completo de firma de documentos</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">3.1. Validez Legal</h3>
              <p className="text-gray-700 leading-relaxed">
                Todos los documentos firmados a través de FDS tienen <strong>plena validez legal</strong> en la 
                República Argentina, equivalente a la firma manuscrita en papel, conforme a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Ley 25.506 de Firma Digital (Arts. 2, 5, 7, 48)</li>
                <li>Código Civil y Comercial de la Nación (Arts. 286-288)</li>
                <li>Normativa complementaria aplicable</li>
              </ul>
            </section>

            {/* 4. Registro y Cuenta */}
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Registro y Cuenta de Usuario</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1. Requisitos de Registro</h3>
              <p className="text-gray-700 leading-relaxed">
                Para utilizar FDS, el Usuario debe:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Ser mayor de 18 años o tener capacidad legal para contratar</li>
                <li>Proporcionar información veraz, completa y actualizada</li>
                <li>Proporcionar DNI/CUIL/CUIT válido</li>
                <li>Proporcionar dirección física verificable</li>
                <li>Crear una contraseña segura</li>
                <li>Aceptar estos Términos y la Política de Privacidad</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.2. Aprobación de Cuenta</h3>
              <p className="text-gray-700 leading-relaxed">
                Las cuentas están sujetas a aprobación por parte de FDS. Nos reservamos el derecho de 
                rechazar o suspender cualquier cuenta sin necesidad de justificación.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.3. Seguridad de la Cuenta</h3>
              <p className="text-gray-700 leading-relaxed">
                El Usuario es responsable de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Mantener la confidencialidad de su contraseña</li>
                <li>Todas las actividades realizadas bajo su cuenta</li>
                <li>Notificar inmediatamente cualquier uso no autorizado</li>
              </ul>
            </section>

            {/* 5. Uso de la Plataforma */}
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Uso Aceptable de la Plataforma</h2>
              
              <h3 className="text-xl font-semibold mb-3">5.1. Conductas Prohibidas</h3>
              <p className="text-gray-700 leading-relaxed">
                El Usuario se compromete a NO:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Utilizar la Plataforma para actividades ilegales</li>
                <li>Falsificar identidad o información personal</li>
                <li>Cargar documentos con contenido ilegal, difamatorio o fraudulento</li>
                <li>Intentar acceder a cuentas de terceros</li>
                <li>Interferir con el funcionamiento de la Plataforma</li>
                <li>Realizar ingeniería inversa del sistema</li>
                <li>Utilizar bots o scripts automatizados sin autorización</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.2. Consecuencias del Incumplimiento</h3>
              <p className="text-gray-700 leading-relaxed">
                El incumplimiento de estas prohibiciones puede resultar en:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Suspensión inmediata de la cuenta</li>
                <li>Eliminación permanente de la cuenta</li>
                <li>Denuncia a las autoridades competentes</li>
                <li>Acciones legales por daños y perjuicios</li>
              </ul>
            </section>

            {/* 6. Protección de Datos */}
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Protección de Datos Personales</h2>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Ley 25.326 de Protección de Datos Personales</p>
                <p className="text-sm text-gray-700">
                  FDS cumple estrictamente con la Ley 25.326 de Protección de los Datos Personales y su 
                  reglamentación. Todos los datos personales son tratados conforme a los principios de:
                </p>
                <ul className="list-disc pl-6 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Legalidad</li>
                  <li>Consentimiento</li>
                  <li>Finalidad</li>
                  <li>Calidad de los datos</li>
                  <li>Seguridad de los datos</li>
                  <li>Confidencialidad</li>
                </ul>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                Para información detallada sobre cómo tratamos sus datos personales, consulte nuestra{' '}
                <Link href="/legal/privacidad" className="text-indigo-600 hover:underline">
                  Política de Privacidad
                </Link>.
              </p>
            </section>

            {/* 7. Propiedad Intelectual */}
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Propiedad Intelectual</h2>
              
              <h3 className="text-xl font-semibold mb-3">7.1. Propiedad de FDS</h3>
              <p className="text-gray-700 leading-relaxed">
                La Plataforma, incluyendo su código fuente, diseño, interfaz, contenido, marcas y logotipos, 
                es propiedad exclusiva de DasLATAM y está protegida por las leyes de propiedad intelectual 
                argentinas e internacionales.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.2. Licencia de Uso</h3>
              <p className="text-gray-700 leading-relaxed">
                FDS otorga al Usuario una licencia limitada, no exclusiva, no transferible y revocable para 
                utilizar la Plataforma conforme a estos Términos.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.3. Contenido del Usuario</h3>
              <p className="text-gray-700 leading-relaxed">
                Los documentos cargados por el Usuario permanecen de su propiedad. Al cargar documentos, 
                el Usuario otorga a FDS una licencia para almacenar, procesar y transmitir dichos documentos 
                únicamente para la prestación del servicio.
              </p>
            </section>

            {/* 8. Responsabilidades */}
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Responsabilidades y Garantías</h2>
              
              <h3 className="text-xl font-semibold mb-3">8.1. Responsabilidad de FDS</h3>
              <p className="text-gray-700 leading-relaxed">
                FDS se compromete a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Mantener la Plataforma disponible 24/7 (objetivo: 99.9% uptime)</li>
                <li>Proteger los datos con medidas de seguridad apropiadas</li>
                <li>Generar evidencia forense válida de cada firma</li>
                <li>Cumplir con toda la normativa legal aplicable</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">8.2. Limitación de Responsabilidad</h3>
              <p className="text-gray-700 leading-relaxed">
                FDS NO será responsable por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>El contenido de los documentos cargados por los Usuarios</li>
                <li>Daños derivados del uso indebido de la Plataforma</li>
                <li>Interrupciones del servicio por causas de fuerza mayor</li>
                <li>Pérdida de datos por causas ajenas a FDS</li>
                <li>Daños indirectos, consecuenciales o lucro cesante</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">8.3. Responsabilidad del Usuario</h3>
              <p className="text-gray-700 leading-relaxed">
                El Usuario es responsable por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>La veracidad de la información proporcionada</li>
                <li>El contenido de los documentos que carga</li>
                <li>Obtener el consentimiento de los firmantes</li>
                <li>Cumplir con la legislación aplicable</li>
                <li>Los daños causados por uso indebido de su cuenta</li>
              </ul>
            </section>

            {/* 9. Tarifas y Pagos */}
            <section>
              <h2 className="text-2xl font-bold mb-4">9. Tarifas y Pagos</h2>
              <p className="text-gray-700 leading-relaxed">
                El uso de FDS está sujeto a las tarifas publicadas en la Plataforma. FDS se reserva el 
                derecho de modificar las tarifas con notificación previa de 30 días.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Los pagos son procesados de forma segura a través de proveedores de pago autorizados.
              </p>
            </section>

            {/* 10. Modificaciones */}
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Modificaciones a los Términos</h2>
              <p className="text-gray-700 leading-relaxed">
                FDS se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones 
                serán notificadas con al menos 15 días de anticipación y entrarán en vigencia al continuar 
                usando la Plataforma.
              </p>
            </section>

            {/* 11. Terminación */}
            <section>
              <h2 className="text-2xl font-bold mb-4">11. Terminación del Servicio</h2>
              <p className="text-gray-700 leading-relaxed">
                Cualquiera de las partes puede terminar la relación:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>El Usuario puede eliminar su cuenta en cualquier momento</li>
                <li>FDS puede suspender o eliminar cuentas que violen estos Términos</li>
                <li>Los documentos se conservarán por el período legalmente requerido</li>
              </ul>
            </section>

            {/* 12. Jurisdicción */}
            <section>
              <h2 className="text-2xl font-bold mb-4">12. Jurisdicción y Ley Aplicable</h2>
              <p className="text-gray-700 leading-relaxed">
                Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia, 
                las partes se someten a la jurisdicción exclusiva de los Tribunales Ordinarios de la Ciudad 
                Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción que pudiera 
                corresponderles.
              </p>
            </section>

            {/* 13. Contacto */}
            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Para consultas sobre estos Términos:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Email:</strong> firmadigitalsimple@daslatam.org</p>
                <p className="text-gray-700"><strong>Web:</strong> https://firmadigitalsimple.vercel.app</p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500">
                <strong>Versión:</strong> 1.0 | <strong>Fecha de vigencia:</strong> Enero 2026
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Estos Términos y Condiciones fueron redactados conforme a la legislación argentina vigente 
                y en cumplimiento de la Ley 25.506 de Firma Digital, el Código Civil y Comercial de la 
                Nación, y la Ley 25.326 de Protección de Datos Personales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
