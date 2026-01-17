import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Firma Digital Simple
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-indigo-100">
              Sistema profesional de firma digital con validez legal en Argentina
            </p>
            <p className="text-lg mb-8 text-indigo-200">
              Cumple con Ley 25.506 | Código Civil y Comercial | Validez Jurídica Plena
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors shadow-xl">
                Comenzar Gratis
              </Link>
              <Link href="/auth" className="bg-indigo-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-900 transition-colors border-2 border-white/20 shadow-xl">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">¿Por qué elegir FDS?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-3">100% Seguro</h3>
              <p className="text-gray-600">
                Encriptación de nivel bancario (TLS 1.3), almacenamiento seguro y validación forense con timestamp.
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">⚖️</div>
              <h3 className="text-xl font-bold mb-3">Validez Legal Total</h3>
              <p className="text-gray-600">
                Cumple Ley 25.506 de Firma Digital y arts. 286-288 del Código Civil y Comercial.
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Rápido y Simple</h3>
              <p className="text-gray-600">
                Sube tu PDF, agrega firmantes y envía. Firmas en minutos, no en días.
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🕐</div>
              <h3 className="text-xl font-bold mb-3">Timestamp Certificado</h3>
              <p className="text-gray-600">
                Cada firma incluye fecha, hora exacta, IP y geolocalización para máxima trazabilidad.
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-bold mb-3">Notificaciones Automáticas</h3>
              <p className="text-gray-600">
                Los firmantes reciben invitaciones por email con acceso directo al documento.
              </p>
            </div>

            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-3">Múltiples Firmantes</h3>
              <p className="text-gray-600">
                Sin límites. Agrega tantos firmantes como necesites. Seguimiento en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Framework Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">Marco Legal Argentino</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            FDS está diseñado para cumplir estrictamente con la legislación argentina vigente
          </p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-3xl mr-3">📜</span>
                Ley 25.506 - Firma Digital
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 2:</strong> La firma digital tiene igual validez que la manuscrita</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 5:</strong> Presunción de autoría del firmante</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 7:</strong> Integridad del documento firmado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 48:</strong> Valor probatorio en juicio</span>
                </li>
              </ul>
            </div>

            <div className="card">
              <h3 className="text-2xl font-bold mb-4 flex items-center">
                <span className="text-3xl mr-3">⚖️</span>
                Código Civil y Comercial
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 286:</strong> Expresión escrita por medios electrónicos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 287:</strong> Firma electrónica reconocida</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Art. 288:</strong> Instrumentos públicos y privados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Plena validez contractual</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 card bg-indigo-50 border-indigo-200">
            <div className="flex items-start">
              <div className="text-4xl mr-4">🛡️</div>
              <div>
                <h4 className="text-xl font-bold mb-2">Seguridad Jurídica Garantizada</h4>
                <p className="text-gray-700">
                  Cada firma digital realizada en FDS genera evidencia forense que incluye: 
                  certificado de firma, timestamp notarial, registro de IP, geolocalización, 
                  y hash criptográfico SHA-256 del documento. Todo esto constituye prueba 
                  suficiente en cualquier procedimiento judicial argentino.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-4">Tecnología de Punta</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            Infraestructura robusta para garantizar seguridad, privacidad y disponibilidad
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-xl font-bold mb-3">Encriptación</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• TLS 1.3 en tránsito</li>
                <li>• AES-256 en reposo</li>
                <li>• Hash SHA-256 por documento</li>
                <li>• Certificados SSL/TLS</li>
              </ul>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">🗄️</div>
              <h3 className="text-xl font-bold mb-3">Almacenamiento</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Supabase PostgreSQL</li>
                <li>• Backups automáticos 24/7</li>
                <li>• Redundancia geográfica</li>
                <li>• 99.9% uptime SLA</li>
              </ul>
            </div>

            <div className="card">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-3">Trazabilidad</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Timestamp preciso (ms)</li>
                <li>• Registro de IP origen</li>
                <li>• User-Agent del navegador</li>
                <li>• Audit log completo</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-block card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                🔒 Cumplimiento RGPD y Ley 25.326 de Protección de Datos
              </p>
              <p className="text-gray-600">
                Tus datos están protegidos bajo los más altos estándares internacionales
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">¿Cómo funciona?</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">1</div>
              <h3 className="font-bold text-lg mb-2">Sube tu PDF</h3>
              <p className="text-gray-600">Carga el documento que necesitas firmar. Cualquier formato PDF.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">2</div>
              <h3 className="font-bold text-lg mb-2">Agrega Firmantes</h3>
              <p className="text-gray-600">Indica quiénes deben firmar el documento con nombre y email.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">3</div>
              <h3 className="font-bold text-lg mb-2">Invita por Email</h3>
              <p className="text-gray-600">Cada firmante recibe un link único y seguro para firmar.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">4</div>
              <h3 className="font-bold text-lg mb-2">¡Listo!</h3>
              <p className="text-gray-600">Recibe el documento firmado con validez legal completa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Comienza a firmar documentos hoy mismo</h2>
          <p className="text-xl mb-4 text-indigo-100">
            Únete a cientos de usuarios que ya confían en FDS para sus documentos importantes
          </p>
          <p className="text-lg mb-8 text-indigo-200">
            ✓ Sin permanencia  ✓ Soporte en español  ✓ Validez legal garantizada
          </p>
          <Link href="/registro" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors inline-block shadow-2xl">
            Crear Cuenta Gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">FDS</h3>
              <p className="text-sm">
                Sistema profesional de firma digital con validez legal en Argentina.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/legal/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
                <li><Link href="/legal/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Marco Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>Ley 25.506 - Firma Digital</li>
                <li>Arts. 286-288 CCyCN</li>
                <li>Ley 25.326 - Datos Personales</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="text-sm">
                Email: firmadigitalsimple@daslatam.org<br />
                Web: firmadigitalsimple.vercel.app
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
            <p className="mt-2 text-gray-500">
              FDS cumple con la Ley 25.506 de Firma Digital y el Código Civil y Comercial de Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
