import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!org || org.role !== 'admin') redirect('/dashboard/user');
  
  const { data: pendingOrgs } = await supabase
    .from('organizations')
    .select('*')
    .eq('approved', false)
    .order('created_at', { ascending: false });
  
  const { data: allDocs } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  async function handleApprove(orgId: string) {
    'use server';
    const supabase = createClient();
    await supabase
      .from('organizations')
      .update({ approved: true, approved_at: new Date().toISOString(), approved_by: user!.id })
      .eq('id', orgId);
  }

  async function handleSignOut() {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <form action={handleSignOut}>
            <button type="submit" className="btn-secondary">Cerrar Sesión</button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm text-gray-600 mb-2">Organizaciones Pendientes</h3>
            <p className="text-3xl font-bold">{pendingOrgs?.length || 0}</p>
          </div>
          <div className="card">
            <h3 className="text-sm text-gray-600 mb-2">Documentos Totales</h3>
            <p className="text-3xl font-bold">{allDocs?.length || 0}</p>
          </div>
          <div className="card">
            <Link href="/dashboard/user" className="btn-primary w-full text-center">
              Ver Mi Dashboard
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Solicitudes Pendientes</h2>
          {pendingOrgs && pendingOrgs.length > 0 ? (
            <div className="space-y-4">
              {pendingOrgs.map((org) => (
                <div key={org.id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">
                        {org.account_type === 'individual' ? org.individual_name : org.company_name}
                      </h3>
                      <p className="text-sm text-gray-600">{org.email}</p>
                      <p className="text-sm text-gray-500">
                        {org.account_type === 'individual' ? 'Particular' : 'Empresa'}
                      </p>
                    </div>
                    <form action={handleApprove.bind(null, org.id)}>
                      <button type="submit" className="btn-primary">Aprobar</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No hay solicitudes pendientes</p>
          )}
        </div>
      </main>
    </div>
  );
}
