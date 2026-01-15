import Link from 'next/link';
import Image from 'next/image';

export default function PrivacidadPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Política de Privacidad</h1>
          <p className="text-gray-600 mb-8">Última actualización: Enero 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Datos que Recopilamos</h2>
              <p className="text-gray-700 mb-3">Recopilamos:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Información de contacto (nombre, email, DNI, domicilio)</li>
                <li>Datos del contrato de alquiler</li>
                <li>Firma digital y metadata (IP, timestamp, user agent)</li>
                <li>Información de uso del servicio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Uso de los Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos sus datos para: proveer el servicio de firma digital, generar contratos, enviar notificaciones, 
                cumplir con obligaciones legales y mejorar nuestro servicio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Protección de Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Implementamos medidas técnicas y organizativas para proteger sus datos conforme a la Ley 25.326. 
                Esto incluye: cifrado HTTPS, control de acceso, backups automáticos y auditoría de accesos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sus Derechos</h2>
              <p className="text-gray-700 mb-3">Usted tiene derecho a:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Exportar sus datos</li>
                <li>Retirar su consentimiento</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Para ejercer estos derechos, contacte a: firmadigitalsimple@daslatam.org
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Conservamos sus datos mientras sea necesario para cumplir con el servicio y obligaciones legales. 
                Los contratos firmados se conservan según requerimientos legales de archivos fiscales (10 años).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Compartir Datos</h2>
              <p className="text-gray-700 leading-relaxed">
                Solo compartimos sus datos con: las partes del contrato (locador/locatario/inmobiliaria), 
                proveedores de servicios esenciales (hosting, email) y cuando lo requiera la ley.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
              <p className="text-gray-700 leading-relaxed">
                Utilizamos cookies esenciales para el funcionamiento del servicio (autenticación, sesión). 
                No utilizamos cookies de publicidad o tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contacto</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900"><strong>Responsable del Tratamiento de Datos</strong></p>
                <p className="text-gray-700">DasLATAM</p>
                <p className="text-gray-700">Email: firmadigitalsimple@daslatam.org</p>
              </div>
            </section>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mt-8">
              <p className="text-sm text-indigo-900">
                <strong>Cumplimiento Legal:</strong> Esta política cumple con la Ley 25.326 de Protección de Datos Personales de Argentina 
                y el RGPD (en lo aplicable). Nos comprometemos a proteger su privacidad y datos personales.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex justify-between">
            <Link href="/legal/terminos" className="text-indigo-600 hover:text-indigo-700 font-medium">
              ← Términos y Condiciones
            </Link>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Volver al inicio →
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm">
          <p>© 2026 DasLATAM - FDS (Firma Digital Simple). Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
