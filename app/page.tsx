import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Firma Digital Simple
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Firma documentos PDF de forma segura, rápida y con validez legal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registro" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-50">
                Comenzar Gratis
              </Link>
              <Link href="/auth" className="bg-indigo-800 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-indigo-900 border-2 border-white/20">
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">¿Cómo funciona?</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Sube tu PDF</h3>
              <p className="text-gray-600">Carga el documento</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Agrega Firmantes</h3>
              <p className="text-gray-600">Indica quiénes firman</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Invita por Email</h3>
              <p className="text-gray-600">Link único por email</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="font-bold text-lg mb-2">¡Listo!</h3>
              <p className="text-gray-600">Documento con validez legal</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 DasLATAM - FDS Firma Digital Simple</p>
        </div>
      </footer>
    </div>
  );
}
