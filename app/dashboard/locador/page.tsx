'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Contract {
  id: string;
  inmueble_direccion: string;
  inmueble_barrio: string;
  inmueble_lote: string;
  fecha_inicio: string;
  fecha_fin: string;
  noches: number;
  precio_total: number;
  moneda: string;
  status: string;
  locador_firma_fecha: string | null;
  locatario_firma_fecha: string | null;
  locatario_nombre: string;
  created_at: string;
}

export default function LocadorDashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    try {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('email, role, approved')
        .eq('user_id', session.user.id)
        .single();

      if (roleError || !userRole) {
        console.error('Error fetching role:', roleError);
        router.push('/auth');
        return;
      }

      if (userRole.role !== 'locador') {
        router.push('/dashboard/inmobiliaria');
        return;
      }

      setUserEmail(userRole.email);

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('locador_email', userRole.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setContracts(data || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  const getStatusBadge = (contract: Contract) => {
    if (contract.status === 'completed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅ Completado</span>;
    }
    if (contract.locador_firma_fecha && !contract.locatario_firma_fecha) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">✓ Firmaste - Esperando locatario</span>;
    }
    if (!contract.locador_firma_fecha && contract.locatario_firma_fecha) {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">⏳ Falta tu firma</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">⏳ Pendiente</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'ARS'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus contratos...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Mis Contratos</h1>
            <p className="text-sm text-gray-600">Vista de Locador (Propietario)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userEmail}</p>
              <p className="text-xs text-gray-600">Locador</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary">
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
            <p className="text-sm text-gray-600">Contratos Totales</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {contracts.filter(c => c.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completados</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">⏳</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {contracts.filter(c => !c.locador_firma_fecha).length}
            </p>
            <p className="text-sm text-gray-600">Pendientes de tu Firma</p>
          </div>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              No tienes contratos
            </h2>
            <p className="text-gray-600 mb-6">
              Cuando tu inmobiliaria cree un contrato donde figuras como locador, aparecerá aquí.
            </p>
            <p className="text-sm text-gray-500">
              Recibirás un email con un enlace para firmar cuando esto ocurra.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Todos tus contratos ({contracts.length})
            </h2>

            {contracts.map((contract) => (
              <div key={contract.id} className="card hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">🏠</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {contract.inmueble_direccion}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Barrio {contract.inmueble_barrio}, Lote {contract.inmueble_lote}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-600 mb-1">Período:</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(contract.fecha_inicio)} - {formatDate(contract.fecha_fin)}
                        </p>
                        <p className="text-xs text-gray-600">{contract.noches} noches</p>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Locatario:</p>
                        <p className="text-gray-900 font-medium">{contract.locatario_nombre}</p>
                      </div>

                      <div>
                        <p className="text-gray-600 mb-1">Precio Total:</p>
                        <p className="text-gray-900 font-medium text-lg">
                          {formatCurrency(contract.precio_total, contract.moneda)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      {contract.locador_firma_fecha ? (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Firmaste el {formatDate(contract.locador_firma_fecha)}
                        </span>
                      ) : (
                        <span className="text-yellow-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                          Pendiente de tu firma
                        </span>
                      )}

                      {contract.locatario_firma_fecha && (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          Locatario firmó
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-2">
                    {getStatusBadge(contract)}
                    
                    <Link
                      href={`/contrato/${contract.id}`}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Ver detalles →
                    </Link>

                    {!contract.locador_firma_fecha && (
                      <Link
                        href={`/firma/${contract.id}?tipo=locador`}
                        className="btn-primary text-sm"
                      >
                        ✍️ Firmar Ahora
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
