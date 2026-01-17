import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function UserDashboard() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!org) redirect('/auth');
  if (!org.approved && org.role !== 'admin') redirect('/pending-approval');
  
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

  async function handleSignOut() {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  const stats = {
    total: documents?.length || 0,
    pending: documents?.filter(d => d.status === 'pending').length || 0,
    partial: documents?.filter(d => d.status === 'partial').length || 0,
    completed: documents?.filter(d => d.status === 'completed').length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Mi Dashboard</h1>
            <p className="text-sm text-gray-600">
              {org.account_type === 'individual' ? org.individual_name : org.company_name}
            </p>
          </div>
          <div className="flex gap-4">
            {org.role === 'admin' && (
              <Link href="/dashboard/admin" className="btn-secondary">
                Panel Admin
              </Link>
            )}
            <form action={handleSignOut}>
              <button type="submit" className="btn-secondary">Cerrar Sesión</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <h3 className="text-sm opacity-90 mb-2">Total Documentos</h3>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-sm opacity-90 mb-2">Pendientes</h3>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <h3 className="text-sm opacity-90 mb-2">Firma Parcial</h3>
            <p className="text-3xl font-bold">{stats.partial}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <h3 className="text-sm opacity-90 mb-2">Completados</h3>
            <p className="text-3xl font-bold">{stats.completed}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mis Documentos</h2>
          <Link href="/dashboard/user/nuevo" className="btn-primary">
            + Nuevo Documento
          </Link>
        </div>

        <div className="card">
          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <div className="mt-2">
                        <span className={`badge badge-${doc.status}`}>
                          {doc.status === 'pending' ? 'Pendiente' :
                           doc.status === 'partial' ? 'Firma Parcial' :
                           doc.status === 'completed' ? 'Completado' : doc.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tienes documentos aún</p>
              <Link href="/dashboard/user/nuevo" className="btn-primary">
                Crear Primer Documento
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
