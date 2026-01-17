import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-4">Cuenta Pendiente de Aprobación</h1>
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido creada exitosamente y está siendo revisada por un administrador.
          Te notificaremos por email cuando sea aprobada.
        </p>
        <Link href="/" className="btn-secondary">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
