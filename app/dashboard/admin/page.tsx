'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  async function checkAdminAndLoadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (!org?.is_admin) {
        router.push('/dashboard/user');
        return;
      }

      await loadPendingOrgs();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPendingOrgs() {
    const supabase = createClient();
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('approved_status', 'pending')
      .order('created_at', { ascending: false });

    setPendingOrgs(data || []);
  }

  async function handleApprove(orgId: string) {
    if (!confirm('¿Aprobar esta cuenta?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({ approved_status: 'approved' })
        .eq('id', orgId);

      if (error) throw error;

      alert('✅ Cuenta aprobada');
      await loadPendingOrgs();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  }

  async function handleReject(orgId: string) {
    if (!confirm('¿Rechazar esta cuenta?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({ approved_status: 'rejected' })
        .eq('id', orgId);

      if (error) throw error;

      alert('✅ Cuenta rechazada');
      await loadPendingOrgs();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3">
                <div className="text-3xl">✍️</div>
                <h1 className="text-2xl font-bold text-indigo-600">FDS Admin</h1>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleLogout} className="btn-secondary">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold mb-8">Panel de Administración</h2>

        <div className="card mb-6">
          <h3 className="text-xl font-bold mb-4">
            Cuentas Pendientes de Aprobación ({pendingOrgs.length})
          </h3>

          {pendingOrgs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">✅</div>
              <p>No hay cuentas pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrgs.map((org) => (
                <div key={org.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold">
                        {org.account_type === 'individual' 
                          ? org.individual_name || 'Sin nombre'
                          : org.company_name || 'Sin nombre'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {org.account_type === 'individual' ? '👤 Particular' : '🏢 Empresa'}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                      ⏳ Pendiente
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{org.email}</p>
                    </div>

                    {org.account_type === 'individual' ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">DNI</p>
                          <p className="font-medium">{org.individual_dni || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CUIL</p>
                          <p className="font-medium">{org.individual_cuil || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Celular</p>
                          <p className="font-medium">{org.individual_phone || 'No especificado'}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">CUIT</p>
                          <p className="font-medium">{org.company_cuit || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rubro</p>
                          <p className="font-medium">{org.company_industry || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <p className="font-medium">{org.company_phone || 'No especificado'}</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    Registrado: {new Date(org.created_at).toLocaleString('es-AR')}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(org.id)}
                      className="btn-primary flex-1"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(org.id)}
                      className="btn-secondary flex-1"
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/legal/terminos" className="hover:text-white">
              Términos y Condiciones
            </Link>
            <Link href="/legal/privacidad" className="hover:text-white">
              Política de Privacidad
            </Link>
          </div>
          <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
