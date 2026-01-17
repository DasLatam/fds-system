import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-3xl">✍️</div>
              <h1 className="text-2xl font-bold text-indigo-600">FDS</h1>
            </Link>
            <nav className="flex gap-4">
              <Link href="/auth" className="btn-secondary">
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="btn-primary">
                Crear Cuenta
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            Firma Digital Simple
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sistema profesional de firma digital con validez legal en Argentina
          </p>
          <Link href="/registro" className="btn-primary text-lg px-8 py-4 inline-block">
            Comenzar Gratis →
          </Link>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            ¿Cómo funciona?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📄</div>
              <div className="text-2xl font-bold text-indigo-600 mb-2">1</div>
              <h3 className="text-lg font-bold mb-2">Sube tu PDF</h3>
              <p className="text-gray-600 text-sm">
                Carga el documento que necesitas firmar
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">👥</div>
              <div className="text-2xl font-bold text-indigo-600 mb-2">2</div>
              <h3 className="text-lg font-bold mb-2">Agrega Firmantes</h3>
              <p className="text-gray-600 text-sm">
                Indica quiénes deben firmar con nombre y email
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <div className="text-2xl font-bold text-indigo-600 mb-2">3</div>
              <h3 className="text-lg font-bold mb-2">Invita por Email</h3>
              <p className="text-gray-600 text-sm">
                Cada firmante recibe un link único y seguro
              </p>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <div className="text-2xl font-bold text-indigo-600 mb-2">4</div>
              <h3 className="text-lg font-bold mb-2">¡Listo!</h3>
              <p className="text-gray-600 text-sm">
                Recibe el documento firmado con validez legal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Beneficios
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Rápido y Fácil</h3>
              <p className="text-gray-600">
                Firma en minutos sin imprimir ni escanear
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3">Ahorra Tiempo y Dinero</h3>
              <p className="text-gray-600">
                Elimina traslados, papelería y demoras
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold mb-3">Desde Cualquier Lugar</h3>
              <p className="text-gray-600">
                Solo necesitas internet en cualquier dispositivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Validez Legal */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Validez Legal Completa
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Cada firma digital cuenta con el respaldo legal necesario en Argentina
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                Marco Legal Argentino
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>
                    <strong>Ley 25.506</strong> de Firma Digital
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>
                    <strong>Código Civil y Comercial</strong> (Arts. 286-288)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>
                    <strong>Ley 25.326</strong> de Protección de Datos
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Seguridad Técnica
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>Timestamp certificado de cada firma</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>Hash SHA-256 del documento</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>Registro forense completo (IP, metadata)</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-lg">✓</span>
                  <div>Encriptación de extremo a extremo</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Comienza a Firmar Hoy
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Crea tu cuenta gratis y empieza a usar firma digital profesional
          </p>
          <Link 
            href="/registro" 
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors inline-block"
          >
            Crear Cuenta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">FDS</h3>
              <p className="text-sm">
                Sistema profesional de firma digital con validez legal en Argentina.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/legal/terminos" className="hover:text-white transition-colors">
                    Términos y Condiciones
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacidad" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="text-sm">
                Email: firmadigitalsimple@daslatam.org
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
