export default function FirmaCompletadaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">¡Firma Completada!</h1>
        <p className="text-gray-600 mb-6">
          Tu firma ha sido registrada exitosamente con plena validez legal.
        </p>
        <p className="text-sm text-gray-500">
          Recibirás un email de confirmación en breve.
        </p>
      </div>
    </div>
  );
}
