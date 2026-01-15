import Image from 'next/image';
import Link from 'next/link';

export default function ExitoFirmaPage({ searchParams }: { searchParams: { role?: string } }) {
  const role = searchParams.role || 'desconocido';
  const roleText = role === 'locador' ? 'Locador' : 'Locatario';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 px-4">
      <div className="max-w-2xl w-full card text-center animate-fade-in-up">
        {/* Icono de éxito */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="DasLATAM" width={60} height={60} />
        </div>
        
        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Firma Exitosa!
        </h1>
        
        <p className="text-xl text-gray-600 mb-6">
          Tu firma como <strong>{roleText}</strong> ha sido registrada correctamente.
        </p>
        
        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-bold text-blue-900 mb-3">¿Qué sigue ahora?</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Recibirás un email de confirmación en breve</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>La otra parte será notificada de tu firma</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Una vez que ambas partes firmen, recibirás el contrato completo en tu email</span>
            </li>
          </ul>
        </div>
        
        {/* Mensaje de agradecimiento */}
        <p className="text-gray-600 mb-8">
          Gracias por usar <strong>FDS - Firma Digital Simple</strong> by DasLATAM
        </p>
        
        {/* Botón */}
        <Link href="/" className="btn-primary inline-block">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
