'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PendingInmobiliaria {
  id: string;
  user_id: string;
  email: string;
  company_name: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
}

interface Stats {
  totalInmobiliarias: number;
  pendingInmobiliarias: number;
  totalContracts: number;
  completedContracts: number;
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<PendingInmobiliaria[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInmobiliarias: 0,
    pendingInmobiliarias: 0,
    totalContracts: 0,
    completedContracts: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('=== ADMIN DASHBOARD MOUNTED ===');
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      console.log('🔍 Starting loadDashboard...');
      const supabase = createClient();
      
      // Verificar sesión
      console.log('🔍 Getting session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('📊 Session result:');
      console.log('  - User ID:', session?.user?.id);
      console.log('  - Email:', session?.user?.email);
      console.log('  - Session error:', sessionError);

      if (!session) {
        console.log('❌ No session found, redirecting to /auth');
        router.push('/auth');
        return;
      }

      // Verificar rol
      console.log('🔍 Checking user role...');
      console.log('  - Querying user_roles for user_id:', session.user.id);
      
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, approved, email')
        .eq('user_id', session.user.id)
        .single();

      console.log('📊 Role query result:');
      console.log('  - Role data:', userRole);
      console.log('  - Role error:', roleError);

      if (roleError) {
        console.error('❌ Error fetching role:', roleError);
        console.log('  - Error code:', roleError.code);
        console.log('  - Error message:', roleError.message);
        router.push('/auth?error=role_error');
        return;
      }

      if (!userRole) {
        console.error('❌ No role found for user');
        router.push('/auth?error=no_role');
        return;
      }

      console.log('✅ Role found:', userRole.role);
      console.log('  - Approved:', userRole.approved);
      console.log('  - Email:', userRole.email);

      if (userRole.role !== 'admin') {
        console.error('❌ User is not admin');
        console.log('  - Actual role:', userRole.role);
        console.log('  - Redirecting to:', `/dashboard/${userRole.role}`);
        router.push(`/dashboard/${userRole.role}`);
        return;
      }

      console.log('✅ User is admin, loading dashboard data...');

      // Cargar pendientes
      const { data: pendingData, error: pendingError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('role', 'inmobiliaria')
        .eq('approved', false)
        .is('rejection_reason', null)
        .order('created_at', { ascending: true });

      if (pendingError) throw pendingError;
      setPending(pendingData || []);
      console.log('✅ Loaded pending inmobiliarias:', pendingData?.length || 0);

      // Cargar estadísticas
      const { count: totalInmo } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inmobiliaria')
        .eq('approved', true);

      const { count: pendingInmo } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inmobiliaria')
        .eq('approved', false);

      const { count: totalContr } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true });

      const { count: completedContr } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalInmobiliarias: totalInmo || 0,
        pendingInmobiliarias: pendingInmo || 0,
        totalContracts: totalContr || 0,
        completedContracts: completedContr || 0
      });

      console.log('✅ Stats loaded:', {
        totalInmobiliarias: totalInmo || 0,
        pendingInmobiliarias: pendingInmo || 0,
        totalContracts: totalContr || 0,
        completedContracts: completedContr || 0
      });

      console.log('=== DASHBOARD LOADED SUCCESSFULLY ===');

    } catch (error) {
      console.error('❌ ERROR in loadDashboard:', error);
      console.error('  - Error details:', JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(userId: string, email: string, companyName: string) {
    if (!confirm(`¿Aprobar la inmobiliaria "${companyName}"?\n\nEsta acción enviará un email de confirmación.`)) {
      return;
    }
    
    setActionLoading(userId);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('user_roles')
        .update({
          approved: true,
          approved_by: session!.user.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`✅ Inmobiliaria "${companyName}" aprobada exitosamente!\n\n` +
            `Se ha enviado un email a ${email} notificándole que puede comenzar a usar el sistema.`);
      
      loadDashboard();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(userId: string, companyName: string) {
    const reason = prompt(
      `¿Por qué rechazas "${companyName}"?\n\n` +
      `Esta razón será enviada al usuario por email.`
    );
    
    if (!reason || reason.trim().length < 10) {
      alert('Debes proporcionar una razón de al menos 10 caracteres');
      return;
    }
    
    setActionLoading(userId);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_roles')
        .update({
          rejection_reason: reason
        })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`❌ Inmobiliaria rechazada.\n\nSe ha enviado un email con la razón del rechazo.`);
      
      loadDashboard();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
          <p className="text-xs text-gray-500 mt-2">Revisa la consola (F12) para ver logs detallados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-sm text-gray-600">Gestión del sistema FDS</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/usuarios" className="btn-secondary">
              👥 Todos los Usuarios
            </Link>
            <button onClick={handleLogout} className="btn-secondary">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🏢</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                stats.pendingInmobiliarias > 0 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.pendingInmobiliarias} pendiente(s)
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalInmobiliarias}</p>
            <p className="text-sm text-gray-600">Inmobiliarias Activas</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
            <p className="text-sm text-gray-600">Contratos Totales</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedContracts}</p>
            <p className="text-sm text-gray-600">Contratos Completados</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalContracts > 0 
                ? Math.round((stats.completedContracts / stats.totalContracts) * 100)
                : 0}%
            </p>
            <p className="text-sm text-gray-600">Tasa de Finalización</p>
          </div>
        </div>

        {/* Pending Inmobiliarias */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Solicitudes Pendientes de Aprobación
          </h2>

          {pending.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay solicitudes pendientes
              </h3>
              <p className="text-gray-600">
                Todas las inmobiliarias han sido revisadas
              </p>
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <span>
                    <strong>{pending.length} inmobiliaria(s)</strong> esperando tu revisión.
                    Estas solicitudes fueron enviadas por usuarios que desean crear contratos en el sistema.
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {pending.map((item, index) => (
                  <div key={item.id} className="card hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">🏢</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {item.company_name || 'Sin nombre'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Solicitud #{index + 1}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">
                              <strong>Email:</strong>
                            </p>
                            <p className="text-gray-900 font-medium">{item.email}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-600 mb-1">
                              <strong>Fecha de registro:</strong>
                            </p>
                            <p className="text-gray-900 font-medium">
                              {new Date(item.created_at).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {item.email_confirmed_at ? (
                          <div className="mt-3 flex items-center text-sm text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            Email verificado
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center text-sm text-yellow-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                            Email pendiente de verificación
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleApprove(item.user_id, item.email, item.company_name)}
                          disabled={actionLoading === item.user_id}
                          className="btn-primary flex items-center justify-center min-w-[120px]"
                        >
                          {actionLoading === item.user_id ? (
                            '...'
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              Aprobar
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleReject(item.user_id, item.company_name)}
                          disabled={actionLoading === item.user_id}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center min-w-[120px]"
                        >
                          {actionLoading === item.user_id ? (
                            '...'
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                              </svg>
                              Rechazar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}