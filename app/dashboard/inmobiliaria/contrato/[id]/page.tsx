'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Contract {
  id: string;
  locador_nombre: string;
  locador_email: string;
  locador_dni: string;
  locatario_nombre: string;
  locatario_email: string;
  locatario_dni: string;
  inmueble_direccion: string;
  inmueble_barrio: string;
  inmueble_lote: string;
  precio_total: number;
  fecha_inicio: string;
  fecha_fin: string;
  noches: number;
  personas_max: number;
  acepta_mascotas: boolean;
  incluye_blanqueria: boolean;
  status: string;
  created_at: string;
  locador_firma_fecha: string | null;
  locatario_firma_fecha: string | null;
  pdf_url: string | null;
}

export default function ContratoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar contrato</h2>
          <p className="text-gray-600 mb-4">{error || 'Contrato no encontrado'}</p>
          <Link href="/dashboard/inmobiliaria" className="btn-primary">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      'pending': { text: 'Pendiente de Firma', class: 'bg-yellow-100 text-yellow-800' },
      'partially_signed': { text: 'Parcialmente Firmado', class: 'bg-blue-100 text-blue-800' },
      'completed': { text: 'Completado', class: 'bg-green-100 text-green-800' },
      'expired': { text: 'Expirado', class: 'bg-red-100 text-red-800' },
    };
    
    const badge = badges[status] || badges['pending'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.class}`}>
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/inmobiliaria" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contrato #{contract.id.slice(0, 8)}</h1>
              <p className="text-gray-600 mt-1">Creado el {formatDate(contract.created_at)}</p>
            </div>
            {getStatusBadge(contract.status)}
          </div>
        </div>

        {/* Estado de Firmas */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`card ${contract.locador_firma_fecha ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Firma del Locador</h3>
                <p className="text-sm text-gray-600">{contract.locador_nombre}</p>
              </div>
              {contract.locador_firma_fecha ? (
                <div className="text-right">
                  <div className="text-2xl text-green-600 mb-1">✓</div>
                  <p className="text-xs text-gray-600">{formatDate(contract.locador_firma_fecha)}</p>
                </div>
              ) : (
                <div className="text-2xl text-yellow-600">⏳</div>
              )}
            </div>
          </div>

          <div className={`card ${contract.locatario_firma_fecha ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Firma del Locatario</h3>
                <p className="text-sm text-gray-600">{contract.locatario_nombre}</p>
              </div>
              {contract.locatario_firma_fecha ? (
                <div className="text-right">
                  <div className="text-2xl text-green-600 mb-1">✓</div>
                  <p className="text-xs text-gray-600">{formatDate(contract.locatario_firma_fecha)}</p>
                </div>
              ) : (
                <div className="text-2xl text-yellow-600">⏳</div>
              )}
            </div>
          </div>
        </div>

        {/* Detalles del Contrato */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Locador */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Locador</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locador_nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">DNI:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locador_dni}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locador_email}</span>
              </div>
            </div>
          </div>

          {/* Locatario */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Locatario</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locatario_nombre}</span>
              </div>
              <div>
                <span className="text-gray-600">DNI:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locatario_dni}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900 font-medium">{contract.locatario_email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles del Inmueble y Contrato */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detalles del Inmueble y Contrato</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Dirección Completa</p>
                <p className="text-gray-900 font-medium">{contract.inmueble_direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Barrio</p>
                <p className="text-gray-900 font-medium">{contract.inmueble_barrio}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lote</p>
                <p className="text-gray-900 font-medium">{contract.inmueble_lote}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="text-gray-900 font-medium">
                  {formatDate(contract.fecha_inicio)} - {formatDate(contract.fecha_fin)}
                </p>
                <p className="text-sm text-gray-600">{contract.noches} noches</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio Total</p>
                <p className="text-2xl text-gray-900 font-bold">{formatCurrency(contract.precio_total)}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-gray-600">Personas Máx.</p>
                  <p className="text-gray-900 font-medium">{contract.personas_max}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mascotas</p>
                  <p className="text-gray-900 font-medium">{contract.acepta_mascotas ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Blanquería</p>
                  <p className="text-gray-900 font-medium">{contract.incluye_blanqueria ? 'Incluida' : 'No incluida'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Final */}
        {contract.status === 'completed' && contract.pdf_url && (
          <div className="card bg-green-50 border-green-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ✅ Contrato Completado
                </h3>
                <p className="text-gray-600">
                  Ambas partes han firmado. El PDF final está disponible para descarga.
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

        {/* Mensaje si está pendiente */}
        {contract.status !== 'completed' && (
          <div className="card bg-yellow-50 border-yellow-300">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⏳ Esperando Firmas
            </h3>
            <p className="text-gray-700">
              Se han enviado emails a las partes con los enlaces para firmar el contrato.
              El PDF final se generará automáticamente cuando ambas partes completen sus firmas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
