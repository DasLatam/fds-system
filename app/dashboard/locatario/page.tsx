import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';

export default async function LocatarioDashboard() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'locatario') {
    redirect('/auth');
  }
  
  // Obtener contratos donde aparece como locatario
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('locatario_email', user.email)
    .order('created_at', { ascending: false });

  const handleSignOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FDS - Panel Locatario</h1>
                <p className="text-sm text-gray-600">{profile.full_name}</p>
              </div>
            </div>
            <form action={handleSignOut}>
              <button type="submit" className="btn-secondary">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Contratos como Locatario</h2>
          <p className="text-gray-600">
            Aquí puedes ver todos los contratos en los que apareces como inquilino (locatario).
          </p>
        </div>

        {!contracts || contracts.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contratos</h3>
            <p className="text-gray-600">Aún no tienes contratos registrados como locatario.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {contract.inmueble_direccion}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {contract.inmueble_barrio}, Lote {contract.inmueble_lote}
                    </p>
                  </div>
                  <span className={`badge ${
                    contract.status === 'firmado_completo' ? 'badge-complete' :
                    contract.status === 'firmado_parcial' ? 'badge-partial' :
                    contract.status === 'pendiente' ? 'badge-pending' :
                    'badge-rejected'
                  }`}>
                    {contract.status === 'firmado_completo' ? 'Firmado' :
                     contract.status === 'firmado_parcial' ? 'Firma Parcial' :
                     contract.status === 'pendiente' ? 'Pendiente' :
                     'Rechazado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600 font-medium">Locador:</p>
                    <p className="text-gray-900">{contract.locador_nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Período:</p>
                    <p className="text-gray-900">{contract.fecha_inicio} - {contract.fecha_fin}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Precio:</p>
                    <p className="text-gray-900 font-bold">
                      {contract.precio_moneda} {contract.precio_total?.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {contract.locatario_firmado_at ? (
                        <>
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700 font-medium">Firmaste el contrato</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          <span className="text-yellow-700 font-medium">Pendiente de tu firma</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {contract.locador_firmado_at ? (
                        <>
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700">Locador firmó</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-600">Locador pendiente</span>
                        </>
                      )}
                    </div>
                  </div>

                  {contract.pdf_firmado_url ? (
                    <a 
                      href={contract.pdf_firmado_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-primary text-sm"
                    >
                      Descargar PDF Firmado
                    </a>
                  ) : contract.pdf_original_url ? (
                    <a 
                      href={contract.pdf_original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm"
                    >
                      Ver Contrato
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
