import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="DasLATAM" width={50} height={50} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FDS</h1>
              <p className="text-xs text-gray-600">Firma Digital Simple</p>
            </div>
          </div>
          <Link href="/auth" className="btn-primary">
            Ingresar
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Firma tus contratos
              <br />en minutos
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Gestión digital de contratos de alquiler temporario.
              Simple, rápido y 100% legal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth" className="btn-primary text-lg px-8 py-4">
                Comenzar ahora
              </Link>
              <a href="#como-funciona" className="btn-secondary text-lg px-8 py-4">
                Ver cómo funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="como-funciona" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16">¿Cómo funciona?</h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">Crea el contrato</h4>
              <p className="text-gray-600">
                La inmobiliaria completa los datos del locador, locatario e inmueble en un formulario simple.
              </p>
            </div>

            <div className="card text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">Envía para firmar</h4>
              <p className="text-gray-600">
                El sistema envía links únicos por email al locador y locatario para que firmen digitalmente.
              </p>
            </div>

            <div className="card text-center transform hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h4 className="text-2xl font-bold mb-4">Descarga el PDF</h4>
              <p className="text-gray-600">
                Una vez firmado por ambas partes, todos reciben el PDF final con las firmas incluidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-bold text-center mb-16">Beneficios</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">100% Digital</h4>
                <p className="text-gray-600">Sin papeles, sin impresoras, sin scanners. Todo desde tu navegador.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Rápido</h4>
                <p className="text-gray-600">Crea y firma contratos en minutos, no en días.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Seguro</h4>
                <p className="text-gray-600">Cada firma es única y verificable. Cumple con normativas legales.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2">Notificaciones</h4>
                <p className="text-gray-600">Emails automáticos en cada paso del proceso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Legal */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Seguridad y Legalidad</h3>
            <p className="text-xl text-gray-600">Tu tranquilidad es nuestra prioridad</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Ley 25.506</h4>
              <p className="text-sm text-gray-700">Firma Digital y Firma Electrónica</p>
            </div>

            <div className="card text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Ley 25.326</h4>
              <p className="text-sm text-gray-700">Protección de Datos Personales</p>
            </div>

            <div className="card text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Art. 288 CCyC</h4>
              <p className="text-sm text-gray-700">Validez Jurídica de Firma Digital</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <h4 className="text-2xl font-bold text-gray-900 mb-6 text-center">Medidas de Seguridad</h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Tokens Únicos</p>
                  <p className="text-sm text-gray-600">Cada firma tiene un enlace único no reutilizable</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Expiración 30 Días</p>
                  <p className="text-sm text-gray-600">Los enlaces expiran automáticamente</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">HTTPS Obligatorio</p>
                  <p className="text-sm text-gray-600">Cifrado SSL/TLS en todas las conexiones</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Rate Limiting</p>
                  <p className="text-sm text-gray-600">Protección anti-spam y ataques</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Auditoría Completa</p>
                  <p className="text-sm text-gray-600">Registro de todas las acciones con IP y timestamp</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900">Backups Automáticos</p>
                  <p className="text-sm text-gray-600">Respaldo diario de toda la información</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para digitalizar tus contratos?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Únete a las inmobiliarias que ya confían en FDS
          </p>
          <Link href="/auth" className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors shadow-xl">
            Comenzar gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
                <div className="text-left">
                  <p className="font-bold">FDS - Firma Digital Simple</p>
                  <p className="text-sm text-gray-400">by DasLATAM</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema de firma digital de contratos 100% legal y seguro.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/legal/terminos" className="hover:text-white transition">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacidad" className="hover:text-white transition">
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contacto</h4>
              <p className="text-sm text-gray-400">
                Email: firmadigitalsimple@daslatam.org
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
            <p className="mt-2">
              Cumple con Ley 25.506 • Ley 25.326 • Art. 288 CCyC
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
