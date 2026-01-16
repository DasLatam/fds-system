'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  user_id: string;
  email: string;
  role: string;
  company_name: string | null;
  approved: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, [filter]);

  async function loadUsers() {
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('role', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId: string, email: string) {
    if (!confirm(`¿Eliminar usuario ${email}?\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }
    
    setActionLoading(userId);
    
    try {
      const supabase = createClient();
      
      // Eliminar de user_roles
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      alert(`✅ Usuario ${email} eliminado exitosamente`);
      loadUsers();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleApproval(userId: string, currentStatus: boolean) {
    setActionLoading(userId);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          approved: !currentStatus,
          approved_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      alert(`✅ Estado actualizado`);
      loadUsers();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    inmobiliaria: users.filter(u => u.role === 'inmobiliaria').length,
    locador: users.filter(u => u.role === 'locador').length,
    locatario: users.filter(u => u.role === 'locatario').length,
    pending: users.filter(u => !u.approved).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
              <p className="text-sm text-gray-600">Todos los usuarios del sistema</p>
            </div>
            <Link href="/dashboard/admin" className="btn-secondary">
              ← Volver al Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-900">{stats.admin}</p>
              <p className="text-xs text-purple-600">Admins</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-900">{stats.inmobiliaria}</p>
              <p className="text-xs text-blue-600">Inmobiliarias</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-900">{stats.locador}</p>
              <p className="text-xs text-green-600">Locadores</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-900">{stats.locatario}</p>
              <p className="text-xs text-orange-600">Locatarios</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              <p className="text-xs text-yellow-600">Pendientes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setFilter('admin')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'admin'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Admins ({stats.admin})
          </button>
          <button
            onClick={() => setFilter('inmobiliaria')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'inmobiliaria'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Inmobiliarias ({stats.inmobiliaria})
          </button>
          <button
            onClick={() => setFilter('locador')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'locador'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Locadores ({stats.locador})
          </button>
          <button
            onClick={() => setFilter('locatario')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'locatario'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Locatarios ({stats.locatario})
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.company_name || user.email}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'inmobiliaria' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'locador' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.approved ? 'Aprobado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleApproval(user.user_id, user.approved)}
                            disabled={actionLoading === user.user_id}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {user.approved ? 'Desaprobar' : 'Aprobar'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.user_id, user.email)}
                          disabled={actionLoading === user.user_id}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}