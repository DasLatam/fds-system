import Link from 'next/link';
import Image from 'next/image';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">FDS - Firma Digital Simple</h1>
              <p className="text-sm text-gray-600">by DasLATAM</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Términos y Condiciones de Uso</h1>
          <p className="text-gray-600 mb-8">Última actualización: Enero 2026</p>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700 mb-4">
              Al acceder y utilizar FDS (Firma Digital Simple), un servicio digital provisto por DasLATAM, 
              usted acepta estar legalmente obligado por estos Términos y Condiciones de Uso en su totalidad. 
              Esta aceptación se produce en el momento en que:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Crea una cuenta en la plataforma</li>
              <li>Utiliza cualquier funcionalidad del servicio</li>
              <li>Firma digitalmente un contrato a través del sistema</li>
              <li>Accede a cualquier parte del sitio web más allá de la página principal</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Si no está de acuerdo con estos términos, debe cesar inmediatamente el uso del servicio. 
              El uso continuado implica aceptación total e incondicional. Estos términos constituyen un 
              acuerdo vinculante entre usted (el "Usuario") y DasLATAM (el "Proveedor del Servicio").
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Capacidad Legal:</strong> Al aceptar estos términos, usted declara y garantiza que: 
              (a) tiene la capacidad legal para celebrar contratos vinculantes, (b) tiene al menos 18 años 
              de edad, (c) no está prohibido de recibir servicios según las leyes argentinas, y (d) cumplirá 
              con estos términos y todas las leyes locales, estatales, nacionales e internacionales aplicables.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Validez Legal de la Firma Digital</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1. Marco Legal Argentino</h3>
            <p className="text-gray-700 mb-4">
              Las firmas digitales generadas a través de FDS tienen <strong>plena validez jurídica</strong> 
              en Argentina, sustentadas en el siguiente marco normativo:
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Ley 25.506 - Firma Digital y Firma Electrónica</h4>
            <p className="text-gray-700 mb-4">
              Esta ley, sancionada el 14 de noviembre de 2001, establece la validez jurídica de la firma 
              electrónica y la firma digital en Argentina. Los artículos relevantes establecen:
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-gray-800 mb-2">
                <strong>Artículo 2:</strong> "Se entiende por firma digital al resultado de aplicar a un 
                documento digital un procedimiento matemático que requiere información de exclusivo conocimiento 
                del firmante, encontrándose ésta bajo su absoluto control."
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Artículo 3:</strong> "Cuando la ley requiera una firma manuscrita, esa exigencia también 
                queda satisfecha por una firma digital. Este principio es aplicable a los casos en que la ley 
                establece la obligación de firmar o prescribe consecuencias para su ausencia."
              </p>
              <p className="text-gray-800">
                <strong>Artículo 5:</strong> "La firma electrónica, cuando sea utilizada en un documento digital, 
                también tendrá validez jurídica si cumple con los requisitos de confiabilidad e integridad."
              </p>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Artículo 288 del Código Civil y Comercial</h4>
            <p className="text-gray-700 mb-4">
              El Código Civil y Comercial de la Nación Argentina, en vigor desde agosto de 2015, 
              modernizó el marco jurídico de los contratos y reconoce expresamente la validez de los 
              instrumentos digitales:
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-gray-800 mb-2">
                <strong>Artículo 288 - Expresión escrita:</strong> "La expresión escrita puede tener lugar por 
                instrumentos públicos, o por instrumentos particulares firmados o no firmados, excepto en los 
                casos en que determinada instrumentación sea impuesta. <strong>Puede hacerse constar en cualquier 
                soporte, siempre que su contenido sea representado con texto inteligible</strong>, aunque su 
                lectura exija medios técnicos."
              </p>
              <p className="text-gray-800">
                Este artículo consagra el principio de <strong>equivalencia funcional</strong> entre documentos 
                en papel y documentos electrónicos, estableciendo que ambos tienen la misma validez jurídica 
                siempre que cumplan con los requisitos de forma aplicables.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2. Requisitos Técnicos de Validez</h3>
            <p className="text-gray-700 mb-4">
              Para que una firma electrónica tenga validez legal según la Ley 25.506, debe cumplir 
              con los siguientes requisitos técnicos, todos los cuales son implementados por FDS:
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-4 space-y-4">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">1. Identificación del Firmante</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> La firma debe identificar de manera inequívoca al firmante.<br/>
                  <strong>Implementación FDS:</strong> Sistema de autenticación mediante email verificado (Magic Link), 
                  registro de datos personales completos (nombre, DNI, email), y vinculación única entre usuario 
                  y firma mediante tokens criptográficos.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">2. Control Exclusivo de los Medios de Firma</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> El firmante debe tener control exclusivo de los datos de creación de la firma.<br/>
                  <strong>Implementación FDS:</strong> Tokens únicos de un solo uso generados con algoritmos criptográficos 
                  (TOTP), enviados exclusivamente al email registrado del firmante. Cada token expira automáticamente 
                  después de 30 días o tras su primer uso.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">3. Integridad del Documento</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> Debe ser posible detectar cualquier modificación posterior a la firma.<br/>
                  <strong>Implementación FDS:</strong> Generación de hash criptográfico (SHA-256) del documento, 
                  almacenamiento inmutable en base de datos PostgreSQL con timestamp preciso, e incrustación de firmas 
                  en el PDF final mediante pdf-lib.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">4. Fecha y Hora Cierta (Timestamping)</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> Debe poder determinarse con precisión el momento de la firma.<br/>
                  <strong>Implementación FDS:</strong> Registro automático de timestamp UTC con precisión de milisegundos, 
                  y almacenamiento en logs de auditoría inmutables.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">5. No Repudio (Non-Repudiation)</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> El firmante no debe poder negar posteriormente haber firmado.<br/>
                  <strong>Implementación FDS:</strong> Registro de metadata forense: IP del firmante, User-Agent, 
                  geolocalización, historial de sesión, y código QR único para verificación.
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-900 mb-2">6. Vinculación Inequívoca con el Documento</h5>
                <p className="text-gray-700 text-sm">
                  <strong>Requisito Legal:</strong> La firma debe estar vinculada al documento de manera única.<br/>
                  <strong>Implementación FDS:</strong> UUID único por contrato, firmas vinculadas criptográficamente 
                  con el hash del documento, y código QR de verificación.
                </p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3. Infraestructura Técnica y Seguridad</h3>
            
            <div className="space-y-4 mb-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h5 className="font-semibold text-gray-900 mb-2">Cifrado y Transmisión Segura</h5>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>TLS 1.3:</strong> Cifrado de última generación</li>
                  <li>• <strong>HTTPS obligatorio:</strong> Certificados SSL/TLS renovados automáticamente</li>
                  <li>• <strong>HSTS habilitado:</strong> HTTP Strict Transport Security</li>
                  <li>• <strong>Cifrado en tránsito:</strong> AES-256-GCM</li>
                </ul>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-semibold text-gray-900 mb-2">Almacenamiento y Persistencia</h5>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>PostgreSQL:</strong> Replicación y backups cada 6 horas</li>
                  <li>• <strong>Cifrado en reposo:</strong> AES-256</li>
                  <li>• <strong>Retención:</strong> 10 años (requisitos fiscales)</li>
                  <li>• <strong>Inmutabilidad:</strong> Logs de auditoría no modificables</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h5 className="font-semibold text-gray-900 mb-2">Auditoría y Trazabilidad</h5>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>Logs completos:</strong> Timestamp, IP, user agent</li>
                  <li>• <strong>Cadena de custodia:</strong> Trazabilidad desde creación hasta firma</li>
                  <li>• <strong>Evidencia forense:</strong> Metadata para peritaje judicial</li>
                  <li>• <strong>Exportación:</strong> Reportes detallados disponibles</li>
                </ul>
              </div>

              <div className="border-l-4 border-red-500 pl-4">
                <h5 className="font-semibold text-gray-900 mb-2">Protección contra Amenazas</h5>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>• <strong>Rate Limiting:</strong> Máximo 10 intentos/minuto</li>
                  <li>• <strong>Monitoreo 24/7:</strong> Detección de actividad sospechosa</li>
                  <li>• <strong>WAF:</strong> Web Application Firewall</li>
                </ul>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Responsabilidades del Usuario</h2>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de credenciales</li>
              <li>No compartir enlaces de firma con terceros</li>
              <li>Utilizar el servicio solo para fines legales</li>
              <li>No intentar vulnerar la seguridad del sistema</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Limitaciones de Responsabilidad</h2>
            <p className="text-gray-700 mb-4">
              DasLATAM proporciona la plataforma tecnológica pero no es parte de los contratos celebrados. 
              No somos responsables por:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Contenido de contratos creados por usuarios</li>
              <li>Disputas entre locadores y locatarios</li>
              <li>Incumplimientos contractuales</li>
              <li>Pérdidas económicas derivadas de contratos</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Contacto</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900"><strong>DasLATAM</strong></p>
              <p className="text-gray-700">Email: firmadigitalsimple@daslatam.org</p>
              <p className="text-gray-700">Sitio: https://firmadigitalsimple.vercel.app</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex justify-between">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">← Volver</Link>
            <Link href="/legal/privacidad" className="text-indigo-600 hover:text-indigo-700 font-medium">Privacidad →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
