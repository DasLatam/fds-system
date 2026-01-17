import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto card">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 mb-6 inline-block">
          ← Volver al inicio
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Información que Recopilamos</h2>
            <p className="text-gray-700">
              Recopilamos la siguiente información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Datos de registro (email, nombre, CUIT/CUIL)</li>
              <li>Documentos PDF cargados para firma</li>
              <li>Metadatos de firma (IP, fecha, hora, user agent)</li>
              <li>Información de uso del servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Uso de la Información</h2>
            <p className="text-gray-700">
              Utilizamos la información para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Proporcionar el servicio de firma digital</li>
              <li>Verificar la identidad de los usuarios</li>
              <li>Cumplir con requisitos legales</li>
              <li>Mejorar nuestro servicio</li>
              <li>Enviar notificaciones relacionadas con el servicio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Protección de Datos</h2>
            <p className="text-gray-700">
              Implementamos medidas de seguridad para proteger su información:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Encriptación SSL/TLS para transmisión de datos</li>
              <li>Almacenamiento seguro en servidores protegidos</li>
              <li>Acceso restringido a información personal</li>
              <li>Auditorías de seguridad periódicas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Compartir Información</h2>
            <p className="text-gray-700">
              No compartimos su información personal con terceros, excepto:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cuando sea requerido por ley</li>
              <li>Con su consentimiento explícito</li>
              <li>Para cumplir con requisitos legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Retención de Datos</h2>
            <p className="text-gray-700">
              Mantenemos sus datos mientras su cuenta esté activa y por el tiempo requerido 
              por ley para fines de archivo y auditoría.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Sus Derechos</h2>
            <p className="text-gray-700">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Acceder a su información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de su cuenta</li>
              <li>Oponerse al procesamiento de sus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Contacto</h2>
            <p className="text-gray-700">
              Para consultas sobre privacidad: firmadigitalsimple@daslatam.org
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Última actualización: Enero 2026
          </p>
        </div>
      </div>
    </div>
  );
}
