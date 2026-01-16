'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ContratoPublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [resolvedParams.id]);

  async function loadContract() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;
      
      setContract(data);
    } catch (err: any) {
      console.error('Error loading contract:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
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
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Contrato no encontrado</h2>
          <p className="text-gray-600 mb-4">{error || 'El contrato que buscas no existe'}</p>
          <Link href="/" className="btn-primary">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Volver
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contrato de Locación</h1>
              <p className="text-gray-600 mt-1">
                ID: {contract.id.slice(0, 8)}... | Creado el {formatDate(contract.created_at)}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              contract.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {contract.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'}
            </span>
          </div>
        </div>

        {/* Estado de Firmas */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`card ${contract.locador_firma_fecha ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Firma del Locador</h3>
                <p className="text-sm text-gray-600">{contract.locador_nombre}</p>
              </div>
              {contract.locador_firma_fecha ? (
                <div className="text-right">
                  <div className="text-3xl text-green-600 mb-1">✓</div>
                  <p className="text-xs text-gray-600">
                    {formatDate(contract.locador_firma_fecha)}
                  </p>
                </div>
              ) : (
                <div className="text-3xl text-gray-400">⏳</div>
              )}
            </div>
          </div>

          <div className={`card ${contract.locatario_firma_fecha ? 'bg-green-50 border-green-300' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Firma del Locatario</h3>
                <p className="text-sm text-gray-600">{contract.locatario_nombre}</p>
              </div>
              {contract.locatario_firma_fecha ? (
                <div className="text-right">
                  <div className="text-3xl text-green-600 mb-1">✓</div>
                  <p className="text-xs text-gray-600">
                    {formatDate(contract.locatario_firma_fecha)}
                  </p>
                </div>
              ) : (
                <div className="text-3xl text-gray-400">⏳</div>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Contrato */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Detalles del Inmueble</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Dirección Completa</p>
                <p className="text-gray-900 font-medium">{contract.inmueble_direccion}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600">Barrio</p>
                  <p className="text-gray-900 font-medium">{contract.inmueble_barrio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lote</p>
                  <p className="text-gray-900 font-medium">{contract.inmueble_lote}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Período de Alquiler</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(contract.fecha_inicio)} - {formatDate(contract.fecha_fin)}
                </p>
                <p className="text-sm text-gray-600">{contract.noches} noches</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio Total</p>
                <p className="text-2xl text-gray-900 font-bold">
                  {formatCurrency(contract.precio_total, contract.moneda)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Características */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Características del Alquiler</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-600">Personas</p>
              <p className="text-lg font-bold text-gray-900">{contract.personas_max}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">{contract.acepta_mascotas ? '🐕' : '🚫'}</div>
              <p className="text-sm text-gray-600">Mascotas</p>
              <p className="text-sm font-medium text-gray-900">
                {contract.acepta_mascotas ? 'Permitidas' : 'No permitidas'}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-gray-600">Electricidad</p>
              <p className="text-sm font-medium text-gray-900">{contract.electricidad_kwts} kWh</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">📺</div>
              <p className="text-sm text-gray-600">DirectTV</p>
              <p className="text-sm font-medium text-gray-900">{contract.directv_tvs} TV(s)</p>
            </div>
          </div>
        </div>

        {/* PDF Download */}
        {contract.status === 'completed' && contract.pdf_url && (
          <div className="card bg-green-50 border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ✅ Contrato Completado
                </h3>
                <p className="text-gray-600">
                  Ambas partes han firmado. El PDF final está disponible.
                </p>
              </div>
              <a
                href={contract.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                📄 Descargar PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
