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
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Información que Recopilamos</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1. Información Personal</h3>
            <p className="text-gray-700 mb-4">
              Cuando utilizas FDS, recopilamos la siguiente información personal:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Nombre completo</li>
              <li>Dirección de correo electrónico</li>
              <li>Número de DNI</li>
              <li>Número de teléfono</li>
              <li>Dirección física</li>
              <li>Información de la empresa (para inmobiliarias)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2. Información de Firma Digital</h3>
            <p className="text-gray-700 mb-4">
              Para garantizar la validez legal de las firmas digitales, registramos:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Fecha y hora exacta de la firma (timestamp UTC)</li>
              <li>Dirección IP desde la cual se realizó la firma</li>
              <li>Información del navegador (User Agent)</li>
              <li>Geolocalización aproximada (solo país y ciudad)</li>
              <li>Hash criptográfico del documento firmado</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Propósito:</strong> Esta información es necesaria para cumplir con los requisitos 
              legales de la firma digital según la Ley 25.506 y proporcionar evidencia forense en caso 
              de disputas legales.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.3. Información de Uso</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Páginas visitadas y funcionalidades utilizadas</li>
              <li>Fecha y hora de acceso</li>
              <li>Errores y problemas técnicos encontrados</li>
              <li>Información del dispositivo y sistema operativo</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Cómo Usamos tu Información</h2>
            <p className="text-gray-700 mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>
                <strong>Proveer el servicio:</strong> Crear, gestionar y almacenar contratos digitales
              </li>
              <li>
                <strong>Validez legal:</strong> Registrar y verificar firmas digitales con plena validez jurídica
              </li>
              <li>
                <strong>Comunicación:</strong> Enviar notificaciones sobre contratos pendientes, actualizaciones del sistema y avisos importantes
              </li>
              <li>
                <strong>Seguridad:</strong> Detectar y prevenir fraudes, abusos y actividad maliciosa
              </li>
              <li>
                <strong>Mejora del servicio:</strong> Analizar el uso para mejorar funcionalidades y experiencia de usuario
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> Cumplir con obligaciones legales y regulatorias aplicables
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Almacenamiento y Seguridad de Datos</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1. Dónde se Almacenan tus Datos</h3>
            <p className="text-gray-700 mb-4">
              Tus datos se almacenan en servidores seguros proporcionados por:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>Supabase:</strong> Base de datos PostgreSQL con cifrado AES-256</li>
              <li><strong>Vercel:</strong> Hosting de la aplicación con certificados SSL/TLS 1.3</li>
              <li>Todos los servidores están ubicados en regiones con cumplimiento GDPR y SOC 2</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2. Medidas de Seguridad</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>Cifrado de datos en tránsito (HTTPS/TLS 1.3) y en reposo (AES-256)</li>
              <li>Autenticación multi-factor para acceso administrativo</li>
              <li>Backups automáticos cada 6 horas con retención de 30 días</li>
              <li>Monitoreo de seguridad 24/7 con detección de intrusiones</li>
              <li>Logs de auditoría inmutables para todas las operaciones críticas</li>
              <li>Rate limiting para prevenir ataques de fuerza bruta</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3. Período de Retención</h3>
            <p className="text-gray-700 mb-4">
              Conservamos tus datos personales durante:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li><strong>Contratos activos:</strong> Mientras estén vigentes + 10 años (requisito fiscal)</li>
              <li><strong>Registros de firmas:</strong> Permanentemente (requisito legal para validez)</li>
              <li><strong>Logs de seguridad:</strong> 2 años</li>
              <li><strong>Cuentas inactivas:</strong> 3 años, luego se elimina automáticamente</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Compartir Información</h2>
            <p className="text-gray-700 mb-4">
              <strong>NO vendemos ni compartimos tu información personal con terceros para fines de marketing.</strong>
            </p>
            <p className="text-gray-700 mb-4">
              Solo compartimos información en los siguientes casos:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li>
                <strong>Con las otras partes del contrato:</strong> Los locadores y locatarios del mismo 
                contrato pueden ver la información relevante del mismo
              </li>
              <li>
                <strong>Con tu inmobiliaria:</strong> Si fuiste agregado por una inmobiliaria, esta puede 
                ver tus contratos
              </li>
              <li>
                <strong>Proveedores de servicio:</strong> Supabase (base de datos), Vercel (hosting), 
                proveedores de email. Todos bajo acuerdos de confidencialidad estrictos
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> Si es requerido por ley, orden judicial o autoridad 
                gubernamental competente
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Tus Derechos</h2>
            <p className="text-gray-700 mb-4">
              Según las leyes de protección de datos aplicables, tienes derecho a:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Acceso:</strong> Solicitar una copia de todos tus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de tus datos (con limitaciones legales)</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado y legible por máquina</li>
              <li><strong>Oposición:</strong> Oponerte al procesamiento de tus datos en ciertos casos</li>
              <li><strong>Restricción:</strong> Solicitar la limitación del procesamiento en ciertos casos</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Importante:</strong> Algunos datos no pueden ser eliminados debido a requisitos legales 
              (como los registros de firmas digitales, que deben conservarse para mantener su validez legal).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Cómo Ejercer tus Derechos</h3>
            <p className="text-gray-700 mb-4">
              Para ejercer cualquiera de estos derechos, contáctanos en:{' '}
              <a href="mailto:firmadigitalsimple@daslatam.org" className="text-indigo-600 hover:underline">
                firmadigitalsimple@daslatam.org
              </a>
            </p>
            <p className="text-gray-700 mb-4">
              Responderemos a tu solicitud dentro de 30 días hábiles. Podemos solicitar verificación 
              de tu identidad antes de procesar la solicitud.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Cookies y Tecnologías de Rastreo</h2>
            <p className="text-gray-700 mb-4">
              FDS utiliza cookies esenciales para:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Mantener tu sesión activa (autenticación)</li>
              <li>Recordar tus preferencias de idioma y región</li>
              <li>Análisis básico de uso (anónimo)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>NO utilizamos cookies de publicidad o rastreo de terceros.</strong>
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Menores de Edad</h2>
            <p className="text-gray-700 mb-4">
              FDS no está dirigido a menores de 18 años. No recopilamos intencionalmente información 
              de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos 
              inmediatamente.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Cambios a esta Política</h2>
            <p className="text-gray-700 mb-4">
              Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos 
              mediante:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
              <li>Aviso destacado en la aplicación</li>
              <li>Email a tu dirección registrada</li>
              <li>Actualización de la fecha "Última actualización" en esta página</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Contacto</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-900 mb-2"><strong>DasLATAM</strong></p>
              <p className="text-gray-700 mb-1">
                Email:{' '}
                <a href="mailto:firmadigitalsimple@daslatam.org" className="text-indigo-600 hover:underline">
                  firmadigitalsimple@daslatam.org
                </a>
              </p>
              <p className="text-gray-700 mb-1">
                Sitio:{' '}
                <a href="https://firmadigitalsimple.vercel.app" className="text-indigo-600 hover:underline">
                  https://firmadigitalsimple.vercel.app
                </a>
              </p>
              <p className="text-gray-700 mt-4 text-sm">
                Para consultas sobre privacidad y protección de datos, responderemos dentro de 48 horas hábiles.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex justify-between">
            <Link href="/legal/terminos" className="text-indigo-600 hover:text-indigo-700 font-medium">← Términos</Link>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">Inicio →</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
