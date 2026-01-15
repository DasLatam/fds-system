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

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 leading-relaxed">
                Al utilizar FDS (Firma Digital Simple), un servicio provisto por DasLATAM, usted acepta estos Términos y Condiciones en su totalidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Validez Legal</h2>
              <p className="text-gray-700 leading-relaxed">
                Las firmas digitales tienen plena validez jurídica conforme a la Ley 25.506 y el Art. 288 del Código Civil y Comercial de Argentina.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Contacto</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900"><strong>DasLATAM</strong></p>
                <p className="text-gray-700">Email: firmadigitalsimple@daslatam.org</p>
              </div>
            </section>
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
