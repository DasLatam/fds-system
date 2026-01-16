'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface UserRole {
  id: string;
  email: string;
  role: string;
  approved: boolean;
  company_name: string | null;
  created_at: string;
  approved_at: string | null;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inmobiliaria' | 'locador' | 'locatario' | 'admin'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = filter === 'all' 
    ? users 
    : users.filter(u => u.role === filter);

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      'admin': { text: 'Admin', class: 'bg-purple-100 text-purple-800' },
      'inmobiliaria': { text: 'Inmobiliaria', class: 'bg-blue-100 text-blue-800' },
      'locador': { text: 'Locador', class: 'bg-green-100 text-green-800' },
      'locatario': { text: 'Locatario', class: 'bg-orange-100 text-orange-800' },
    };
    
    const badge = badges[role] || { text: role, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard/admin" className="text-indigo-600 hover:text-indigo-700 mb-2 inline-block">
              ← Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Todos los Usuarios</h1>
            <p className="text-gray-600">Gestión completa de usuarios del sistema</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Filtrar por rol:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              onClick={() => setFilter('inmobiliaria')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === 'inmobiliaria'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inmobiliarias ({users.filter(u => u.role === 'inmobiliaria').length})
            </button>
            <button
              onClick={() => setFilter('locador')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === 'locador'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Locadores ({users.filter(u => u.role === 'locador').length})
            </button>
            <button
              onClick={() => setFilter('locatario')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === 'locatario'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Locatarios ({users.filter(u => u.role === 'locatario').length})
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filter === 'admin'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admins ({users.filter(u => u.role === 'admin').length})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
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
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No hay usuarios con este filtro
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.company_name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.approved ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Aprobado
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                            ⏳ Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-600">Total Usuarios</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'inmobiliaria').length}
            </p>
            <p className="text-sm text-gray-600">Inmobiliarias</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === 'locador').length}
            </p>
            <p className="text-sm text-gray-600">Locadores</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.role === 'locatario').length}
            </p>
            <p className="text-sm text-gray-600">Locatarios</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {users.filter(u => !u.approved).length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
