import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import ContractsList from '@/components/ContractsList';

export default async function InmobiliariaDashboard() {
  const supabase = createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }
  
  // Verificar rol
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'inmobiliaria') {
    redirect('/auth');
  }
  
  // Obtener estadísticas
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });
  
  const stats = {
    total: contracts?.length || 0,
    pendientes: contracts?.filter(c => c.status === 'pendiente').length || 0,
    parciales: contracts?.filter(c => c.status === 'firmado_parcial').length || 0,
    completos: contracts?.filter(c => c.status === 'firmado_completo').length || 0,
  };

  const handleSignOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FDS - Panel Inmobiliaria</h1>
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
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
          <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-2">Total Contratos</h3>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-2">Pendientes</h3>
            <p className="text-3xl font-bold">{stats.pendientes}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-2">Firma Parcial</h3>
            <p className="text-3xl font-bold">{stats.parciales}</p>
          </div>
          
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-sm font-medium opacity-90 mb-2">Completos</h3>
            <p className="text-3xl font-bold">{stats.completos}</p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis Contratos</h2>
          <Link href="/dashboard/inmobiliaria/nuevo-contrato" className="btn-primary">
            + Nuevo Contrato
          </Link>
        </div>

        {/* Lista de contratos */}
        <ContractsList contracts={contracts || []} />
      </main>
    </div>
  );
}
