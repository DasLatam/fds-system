import Link from 'next/link';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto card">
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 mb-6 inline-block">
          ← Volver al inicio
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>
        
        <div className="prose max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Aceptación de los Términos</h2>
            <p className="text-gray-700">
              Al utilizar FDS - Firma Digital Simple, usted acepta estos términos y condiciones en su totalidad.
              Si no está de acuerdo con estos términos, no utilice este servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Descripción del Servicio</h2>
            <p className="text-gray-700">
              FDS proporciona un sistema de firma digital para documentos PDF con validez legal según la 
              Ley 25.506 de Firma Digital de la República Argentina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Responsabilidad del Usuario</h2>
            <p className="text-gray-700">
              Los usuarios son responsables de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Verificar la exactitud de los documentos antes de solicitar firmas</li>
              <li>Cumplir con las leyes aplicables en su jurisdicción</li>
              <li>No usar el servicio con fines fraudulentos o ilícitos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Validez Legal</h2>
            <p className="text-gray-700">
              Las firmas digitales realizadas a través de FDS tienen plena validez legal conforme a la 
              Ley 25.506 y sus normas complementarias en Argentina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitación de Responsabilidad</h2>
            <p className="text-gray-700">
              FDS no se hace responsable por:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>El contenido de los documentos cargados por los usuarios</li>
              <li>Disputas legales entre las partes firmantes</li>
              <li>Interrupciones temporales del servicio por mantenimiento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Modificaciones</h2>
            <p className="text-gray-700">
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los usuarios serán notificados de cambios significativos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Contacto</h2>
            <p className="text-gray-700">
              Para consultas sobre estos términos: firmadigitalsimple@daslatam.org
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
