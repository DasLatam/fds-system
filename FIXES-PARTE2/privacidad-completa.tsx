import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="mb-8">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
              ← Volver al Inicio
            </Link>
            <h1 className="text-4xl font-bold mb-4">Política de Privacidad</h1>
            <p className="text-gray-600">
              FDS - Firma Digital Simple | Última actualización: Enero 2026
            </p>
          </div>

          <div className="prose max-w-none space-y-6">
            {/* 1. Introducción */}
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed">
                DasLATAM, operador de FDS - Firma Digital Simple (en adelante, "FDS", "Nosotros" o la "Plataforma"), 
                se compromete a proteger la privacidad de todos los usuarios (en adelante, "Usted" o el "Usuario").
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información 
                personal en cumplimiento con:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Ley 25.326 de Protección de los Datos Personales</strong> (Argentina)</li>
                <li>Decreto Reglamentario 1558/2001</li>
                <li><strong>Reglamento General de Protección de Datos (RGPD)</strong> de la Unión Europea</li>
                <li>Disposiciones de la Agencia de Acceso a la Información Pública (AAIP)</li>
              </ul>
            </section>

            {/* 2. Marco Legal */}
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Marco Legal Aplicable</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1. Ley 25.326 - Protección de Datos Personales</h3>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 1 - Objeto</p>
                <p className="text-sm text-gray-700 italic">
                  "La presente ley tiene por objeto la protección integral de los datos personales asentados en 
                  archivos, registros, bancos de datos, u otros medios técnicos de tratamiento de datos, sean éstos 
                  públicos, o privados destinados a dar informes, para garantizar el derecho al honor y a la intimidad 
                  de las personas, así como también el acceso a la información que sobre las mismas se registre, de 
                  conformidad a lo establecido en el artículo 43, párrafo tercero de la Constitución Nacional."
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 2 - Definiciones</p>
                <p className="text-sm text-gray-700 italic">
                  "A los fines de la presente ley se entiende por:<br/>
                  • Datos personales: Información de cualquier tipo referida a personas físicas o de existencia ideal 
                  determinadas o determinables.<br/>
                  • Datos sensibles: Datos personales que revelan origen racial y étnico, opiniones políticas, 
                  convicciones religiosas, filosóficas o morales, afiliación sindical e información referente a la 
                  salud o a la vida sexual.<br/>
                  • Archivo, registro, base o banco de datos: Indistintamente, designan al conjunto organizado de 
                  datos personales que sean objeto de tratamiento o procesamiento, electrónico o no, cualquiera que 
                  fuere la modalidad de su formación, almacenamiento, organización o acceso."
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 4 - Calidad de los datos</p>
                <p className="text-sm text-gray-700 italic">
                  "1. Los datos personales que se recojan a los efectos de su tratamiento deben ser ciertos, adecuados, 
                  pertinentes y no excesivos en relación al ámbito y finalidad para los que se hubieren obtenido.<br/>
                  2. La recolección de datos no puede hacerse por medios desleales, fraudulentos o en forma contraria 
                  a las disposiciones de la presente ley.<br/>
                  3. Los datos objeto de tratamiento no pueden ser utilizados para finalidades distintas o incompatibles 
                  con aquellas que motivaron su obtención.<br/>
                  4. Los datos deben ser exactos y actualizarse en el caso de que ello fuere necesario.<br/>
                  5. Los datos total o parcialmente inexactos, o que sean incompletos, deben ser suprimidos y 
                  sustituidos, o en su caso completados, por el responsable del archivo o base de datos cuando se 
                  tenga conocimiento de la inexactitud o carácter incompleto de la información de que se trate."
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 5 - Consentimiento</p>
                <p className="text-sm text-gray-700 italic">
                  "1. El tratamiento de datos personales es ilícito cuando el titular no hubiere prestado su 
                  consentimiento libre, expreso e informado, el que deberá constar por escrito, o por otro medio 
                  que permita se le equipare, de acuerdo a las circunstancias.<br/>
                  2. El referido consentimiento prestado con otras declaraciones, deberá figurar en forma expresa 
                  y destacada, previa notificación al requerido de datos, de la información descrita en el artículo 6º 
                  de la presente ley."
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 9 - Seguridad de los datos</p>
                <p className="text-sm text-gray-700 italic">
                  "1. El responsable o usuario del archivo de datos debe adoptar las medidas técnicas y organizativas 
                  que resulten necesarias para garantizar la seguridad y confidencialidad de los datos personales, 
                  de modo de evitar su adulteración, pérdida, consulta o tratamiento no autorizado, y que permitan 
                  detectar desviaciones, intencionales o no, de información, ya sea que los riesgos provengan de la 
                  acción humana o del medio técnico utilizado.<br/>
                  2. Queda prohibido registrar datos personales en archivos, registros o bancos que no reúnan 
                  condiciones técnicas de integridad y seguridad."
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2. RGPD - Reglamento General de Protección de Datos</h3>
              <p className="text-gray-700 leading-relaxed">
                Aunque FDS opera principalmente en Argentina, adoptamos los estándares más altos de protección 
                de datos, incluyendo principios del RGPD de la Unión Europea:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Licitud, lealtad y transparencia</li>
                <li>Limitación de la finalidad</li>
                <li>Minimización de datos</li>
                <li>Exactitud</li>
                <li>Limitación del plazo de conservación</li>
                <li>Integridad y confidencialidad</li>
                <li>Responsabilidad proactiva</li>
              </ul>
            </section>

            {/* 3. Información Recopilada */}
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Información que Recopilamos</h2>
              
              <h3 className="text-xl font-semibold mb-3">3.1. Información de Registro</h3>
              <p className="text-gray-700 leading-relaxed">
                Al crear una cuenta en FDS, recopilamos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Para individuos:</strong> Nombre completo, DNI, CUIL, dirección, teléfono, email</li>
                <li><strong>Para empresas:</strong> Razón social, CUIT, rubro, dirección, teléfono, email, datos del apoderado</li>
                <li><strong>Credenciales:</strong> Email y contraseña encriptada</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">3.2. Información de Firma</h3>
              <p className="text-gray-700 leading-relaxed">
                Al firmar un documento, registramos:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Nombre del firmante</li>
                <li>Email del firmante</li>
                <li>DNI del firmante</li>
                <li>Dirección del firmante</li>
                <li>Teléfono del firmante</li>
                <li>Firma manuscrita digital (imagen)</li>
                <li>Timestamp (fecha y hora exacta)</li>
                <li>Dirección IP</li>
                <li>User-Agent (navegador y sistema operativo)</li>
                <li>Geolocalización aproximada</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">3.3. Documentos</h3>
              <p className="text-gray-700 leading-relaxed">
                Almacenamos los documentos PDF que usted carga para ser firmados, junto con su metadata 
                (nombre, tamaño, fecha de carga, etc.).
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">3.4. Información Técnica</h3>
              <p className="text-gray-700 leading-relaxed">
                Recopilamos automáticamente:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li>Dirección IP</li>
                <li>Tipo de navegador</li>
                <li>Páginas visitadas</li>
                <li>Hora y fecha de acceso</li>
                <li>Cookies técnicas necesarias para el funcionamiento</li>
              </ul>
            </section>

            {/* 4. Uso de la Información */}
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Cómo Usamos su Información</h2>
              
              <h3 className="text-xl font-semibold mb-3">4.1. Finalidades del Tratamiento</h3>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos su información personal exclusivamente para:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Prestación del servicio:</strong> Permitir la firma digital de documentos</li>
                <li><strong>Validación legal:</strong> Generar evidencia forense con validez jurídica</li>
                <li><strong>Comunicaciones:</strong> Enviar notificaciones sobre documentos pendientes o firmados</li>
                <li><strong>Seguridad:</strong> Prevenir fraude y uso no autorizado</li>
                <li><strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y regulatorias</li>
                <li><strong>Mejora del servicio:</strong> Analizar uso para mejorar la Plataforma</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
                <p className="font-semibold mb-2">⚠️ Importante</p>
                <p className="text-sm text-gray-700">
                  <strong>NO vendemos, alquilamos ni compartimos</strong> su información personal con terceros 
                  para fines comerciales o de marketing. Su información es utilizada ÚNICAMENTE para la prestación 
                  del servicio de firma digital.
                </p>
              </div>
            </section>

            {/* 5. Base Legal */}
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Base Legal para el Tratamiento</h2>
              <p className="text-gray-700 leading-relaxed">
                El tratamiento de sus datos personales se fundamenta en:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Consentimiento:</strong> Al registrarse, usted otorga su consentimiento expreso e informado</li>
                <li><strong>Ejecución de contrato:</strong> El tratamiento es necesario para prestar el servicio contratado</li>
                <li><strong>Obligación legal:</strong> Debemos conservar registros para cumplir con la Ley 25.506</li>
                <li><strong>Interés legítimo:</strong> Seguridad y prevención de fraude</li>
              </ul>
            </section>

            {/* 6. Almacenamiento */}
            <section>
              <h2 className="text-2xl font-bold mb-4">6. Almacenamiento y Seguridad</h2>
              
              <h3 className="text-xl font-semibold mb-3">6.1. Medidas de Seguridad</h3>
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas de seguridad técnicas y organizativas de nivel bancario:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Encriptación en tránsito:</strong> TLS 1.3 para todas las comunicaciones</li>
                <li><strong>Encriptación en reposo:</strong> AES-256 para datos almacenados</li>
                <li><strong>Hash criptográfico:</strong> SHA-256 para documentos</li>
                <li><strong>Autenticación robusta:</strong> Contraseñas hasheadas con bcrypt</li>
                <li><strong>Control de acceso:</strong> Principio de mínimo privilegio</li>
                <li><strong>Backups automáticos:</strong> Respaldo diario con redundancia geográfica</li>
                <li><strong>Monitoreo 24/7:</strong> Detección de intrusiones y actividades sospechosas</li>
                <li><strong>Auditorías regulares:</strong> Revisión de seguridad periódica</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">6.2. Ubicación de los Datos</h3>
              <p className="text-gray-700 leading-relaxed">
                Sus datos se almacenan en servidores seguros proporcionados por Supabase (PostgreSQL), 
                con centros de datos que cumplen con estándares internacionales de seguridad.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">6.3. Período de Conservación</h3>
              <p className="text-gray-700 leading-relaxed">
                Conservamos sus datos personales:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Datos de cuenta:</strong> Mientras su cuenta esté activa</li>
                <li><strong>Documentos firmados:</strong> Mínimo 10 años (obligación legal según Ley 25.506)</li>
                <li><strong>Metadata de firmas:</strong> Indefinidamente (evidencia forense)</li>
                <li><strong>Datos técnicos:</strong> Máximo 2 años</li>
              </ul>
            </section>

            {/* 7. Derechos del Usuario */}
            <section>
              <h2 className="text-2xl font-bold mb-4">7. Sus Derechos</h2>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                <p className="font-semibold mb-2">Artículo 14 - Derecho de Acceso</p>
                <p className="text-sm text-gray-700 italic">
                  "El titular de los datos, previa acreditación de su identidad, tiene derecho a solicitar y obtener 
                  información de sus datos personales incluidos en los bancos de datos públicos, o privados destinados 
                  a proveer informes."
                </p>
              </div>

              <p className="text-gray-700 leading-relaxed">
                Conforme a la Ley 25.326 y el RGPD, usted tiene los siguientes derechos:
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.1. Derecho de Acceso</h3>
              <p className="text-gray-700 leading-relaxed">
                Puede solicitar una copia de todos sus datos personales que tenemos almacenados.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.2. Derecho de Rectificación</h3>
              <p className="text-gray-700 leading-relaxed">
                Puede solicitar la corrección de datos inexactos o incompletos.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.3. Derecho de Supresión</h3>
              <p className="text-gray-700 leading-relaxed">
                Puede solicitar la eliminación de sus datos personales, excepto aquellos que debemos conservar 
                por obligación legal (como documentos firmados).
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.4. Derecho de Oposición</h3>
              <p className="text-gray-700 leading-relaxed">
                Puede oponerse al tratamiento de sus datos en ciertos casos.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.5. Derecho de Portabilidad</h3>
              <p className="text-gray-700 leading-relaxed">
                Puede solicitar recibir sus datos en formato estructurado y de uso común.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">7.6. Cómo Ejercer sus Derechos</h3>
              <p className="text-gray-700 leading-relaxed">
                Para ejercer cualquiera de estos derechos, envíe un email a:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Email:</strong> firmadigitalsimple@daslatam.org</p>
                <p className="text-gray-700 text-sm mt-2">
                  Incluya: (1) Asunto: "Ejercicio de Derechos - [Tipo de Derecho]", (2) Nombre completo, 
                  (3) DNI/CUIL, (4) Email registrado, (5) Descripción del derecho que desea ejercer
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-3">
                Responderemos su solicitud en un plazo máximo de <strong>10 días hábiles</strong>.
              </p>
            </section>

            {/* 8. Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4">8. Uso de Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                FDS utiliza únicamente <strong>cookies técnicas estrictamente necesarias</strong> para el 
                funcionamiento de la Plataforma (sesión, autenticación, preferencias).
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>NO utilizamos cookies de marketing, publicidad o terceros.</strong>
              </p>
            </section>

            {/* 9. Menores */}
            <section>
              <h2 className="text-2xl font-bold mb-4">9. Menores de Edad</h2>
              <p className="text-gray-700 leading-relaxed">
                FDS no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
                de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos inmediatamente.
              </p>
            </section>

            {/* 10. Compartir Información */}
            <section>
              <h2 className="text-2xl font-bold mb-4">10. Compartir Información con Terceros</h2>
              <p className="text-gray-700 leading-relaxed">
                Solo compartimos su información con terceros en estos casos limitados:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-3">
                <li><strong>Proveedores de servicios:</strong> Supabase (almacenamiento), Resend (emails), bajo estrictos 
                acuerdos de confidencialidad</li>
                <li><strong>Obligación legal:</strong> Cuando sea requerido por autoridades judiciales o administrativas</li>
                <li><strong>Consentimiento expreso:</strong> Cuando usted autorice expresamente</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>En ningún caso</strong> vendemos, alquilamos o comercializamos su información personal.
              </p>
            </section>

            {/* 11. Cambios */}
            <section>
              <h2 className="text-2xl font-bold mb-4">11. Cambios a esta Política</h2>
              <p className="text-gray-700 leading-relaxed">
                Nos reservamos el derecho de modificar esta Política de Privacidad. Las modificaciones serán 
                notificadas con al menos 15 días de anticipación por email o mediante aviso destacado en la Plataforma.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                El uso continuado de la Plataforma tras la notificación constituye aceptación de los cambios.
              </p>
            </section>

            {/* 12. Autoridad de Control */}
            <section>
              <h2 className="text-2xl font-bold mb-4">12. Autoridad de Control</h2>
              <p className="text-gray-700 leading-relaxed">
                Si considera que sus derechos han sido vulnerados, puede presentar una denuncia ante:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mt-3">
                <p className="text-gray-700 font-semibold">
                  Agencia de Acceso a la Información Pública (AAIP)
                </p>
                <p className="text-gray-700 text-sm mt-2">
                  Sitio web: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" 
                  className="text-indigo-600 hover:underline">https://www.argentina.gob.ar/aaip</a>
                </p>
                <p className="text-gray-700 text-sm">
                  Email: datospersonales@aaip.gob.ar
                </p>
                <p className="text-gray-700 text-sm">
                  Dirección: Av. Pres. Gral. Julio A. Roca 710, Piso 3, CABA
                </p>
              </div>
            </section>

            {/* 13. Contacto */}
            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contacto</h2>
              <p className="text-gray-700 leading-relaxed">
                Para consultas sobre esta Política de Privacidad o sobre el tratamiento de sus datos personales:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Responsable del Tratamiento:</strong> DasLATAM</p>
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
                Esta Política de Privacidad fue redactada en cumplimiento de la <strong>Ley 25.326 de Protección 
                de los Datos Personales</strong>, su Decreto Reglamentario 1558/2001, y las disposiciones de la 
                Agencia de Acceso a la Información Pública (AAIP), incorporando los estándares del RGPD de la 
                Unión Europea.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
