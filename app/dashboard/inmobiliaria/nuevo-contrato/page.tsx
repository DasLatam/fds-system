'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function NuevoContratoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Locador
    locador_nombre: '',
    locador_email: '',
    locador_dni: '',
    locador_telefono: '',
    locador_domicilio: '',
    
    // Locatario
    locatario_nombre: '',
    locatario_email: '',
    locatario_dni: '',
    locatario_telefono: '',
    locatario_domicilio: '',
    
    // Inmueble
    inmueble_direccion: 'Costa Esmeralda Km 380 Ruta 11',
    inmueble_barrio: 'Deportiva',
    inmueble_lote: '278',
    inmueble_localidad: 'Partido de la Costa',
    inmueble_provincia: 'Buenos Aires',
    
    // Fechas
    fecha_inicio: '',
    fecha_fin: '',
    noches: 0,
    
    // Detalles
    personas_max: 6,
    acepta_mascotas: false,
    incluye_blanqueria: false,
    incluye_limpieza: false,
    
    // Servicios
    electricidad_kwts: 100,
    directv_tvs: '1',
    
    // Precios
    precio_total: 0,
    moneda: 'USD' as 'USD' | 'ARS',
    deposito_garantia: 0,
    clausula_penal_diaria: 500,
  });

  // Calcular noches automáticamente
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const inicio = new Date(formData.fecha_inicio);
      const fin = new Date(formData.fecha_fin);
      const diff = fin.getTime() - inicio.getTime();
      const noches = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (noches > 0 && noches !== formData.noches) {
        setFormData(prev => ({ ...prev, noches }));
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin]);

  // Calcular depósito automáticamente (20% del precio)
  useEffect(() => {
    if (formData.precio_total > 0) {
      const deposito = Math.round(formData.precio_total * 0.2);
      if (deposito !== formData.deposito_garantia) {
        setFormData(prev => ({ ...prev, deposito_garantia: deposito }));
      }
    }
  }, [formData.precio_total]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Validaciones
      if (formData.noches <= 0) {
        throw new Error('Las fechas son inválidas. La fecha de fin debe ser posterior a la de inicio.');
      }

      if (formData.precio_total <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      // Crear contrato
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          ...formData,
          status: 'pending',
          created_by: (await supabase.auth.getSession()).data.session!.user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Enviar emails (esto se hace en el backend via edge function o API)
      const response = await fetch('/api/contracts/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: data.id })
      });

      if (!response.ok) {
        console.error('Error sending emails:', await response.text());
      }

      alert('¡Contrato creado exitosamente!\n\nSe han enviado emails a las partes para que firmen.');
      router.push(`/dashboard/inmobiliaria/contrato/${data.id}`);

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-indigo-600 hover:text-indigo-700 mb-4 flex items-center"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Contrato</h1>
          <p className="text-gray-600 mt-1">Completa los datos para generar el contrato de locación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* LOCADOR */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👤 Datos del Locador (Propietario)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locador_nombre}
                  onChange={e => setFormData({...formData, locador_nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locador_dni}
                  onChange={e => setFormData({...formData, locador_dni: e.target.value})}
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.locador_email}
                  onChange={e => setFormData({...formData, locador_email: e.target.value})}
                  placeholder="locador@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={formData.locador_telefono}
                  onChange={e => setFormData({...formData, locador_telefono: e.target.value})}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domicilio *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locador_domicilio}
                  onChange={e => setFormData({...formData, locador_domicilio: e.target.value})}
                  placeholder="Calle 123, Ciudad, Provincia"
                />
              </div>
            </div>
          </div>

          {/* LOCATARIO */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">👥 Datos del Locatario (Inquilino)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locatario_nombre}
                  onChange={e => setFormData({...formData, locatario_nombre: e.target.value})}
                  placeholder="Ej: María González"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locatario_dni}
                  onChange={e => setFormData({...formData, locatario_dni: e.target.value})}
                  placeholder="87654321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.locatario_email}
                  onChange={e => setFormData({...formData, locatario_email: e.target.value})}
                  placeholder="locatario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  value={formData.locatario_telefono}
                  onChange={e => setFormData({...formData, locatario_telefono: e.target.value})}
                  placeholder="+54 9 11 8765-4321"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domicilio *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.locatario_domicilio}
                  onChange={e => setFormData({...formData, locatario_domicilio: e.target.value})}
                  placeholder="Calle 456, Ciudad, Provincia"
                />
              </div>
            </div>
          </div>

          {/* INMUEBLE */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🏠 Datos del Inmueble</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.inmueble_direccion}
                  onChange={e => setFormData({...formData, inmueble_direccion: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barrio *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.inmueble_barrio}
                  onChange={e => setFormData({...formData, inmueble_barrio: e.target.value})}
                  placeholder="Deportiva, Senderos IV, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lote *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.inmueble_lote}
                  onChange={e => setFormData({...formData, inmueble_lote: e.target.value})}
                  placeholder="278"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Localidad *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.inmueble_localidad}
                  onChange={e => setFormData({...formData, inmueble_localidad: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.inmueble_provincia}
                  onChange={e => setFormData({...formData, inmueble_provincia: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* FECHAS Y DETALLES */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Fechas y Detalles</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Inicio *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.fecha_inicio}
                  onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Fin *
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.fecha_fin}
                  onChange={e => setFormData({...formData, fecha_fin: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Noches
                </label>
                <input
                  type="number"
                  className="input-field bg-gray-50"
                  value={formData.noches}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Calculado automáticamente</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personas Máximas *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  className="input-field"
                  value={formData.personas_max}
                  onChange={e => setFormData({...formData, personas_max: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Electricidad Incluida (kWh)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input-field"
                  value={formData.electricidad_kwts}
                  onChange={e => setFormData({...formData, electricidad_kwts: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DirectTV (TVs)
                </label>
                <select
                  className="input-field"
                  value={formData.directv_tvs}
                  onChange={e => setFormData({...formData, directv_tvs: e.target.value})}
                >
                  <option value="0">Sin DirectTV</option>
                  <option value="1">1 TV</option>
                  <option value="2">2 TVs</option>
                  <option value="todas">Todas las TVs</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="checkbox"
                  checked={formData.acepta_mascotas}
                  onChange={e => setFormData({...formData, acepta_mascotas: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">🐕 Acepta Mascotas</span>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="checkbox"
                  checked={formData.incluye_blanqueria}
                  onChange={e => setFormData({...formData, incluye_blanqueria: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">🛏️ Incluye Blanquería</span>
              </label>

              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 transition">
                <input
                  type="checkbox"
                  checked={formData.incluye_limpieza}
                  onChange={e => setFormData({...formData, incluye_limpieza: e.target.checked})}
                  className="mr-3"
                />
                <span className="text-sm font-medium text-gray-700">🧹 Incluye Limpieza</span>
              </label>
            </div>
          </div>

          {/* PRECIOS */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💰 Precios</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda *
                </label>
                <select
                  required
                  className="input-field"
                  value={formData.moneda}
                  onChange={e => setFormData({...formData, moneda: e.target.value as 'USD' | 'ARS'})}
                >
                  <option value="USD">Dólares (USD)</option>
                  <option value="ARS">Pesos Argentinos (ARS)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Total *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.precio_total}
                  onChange={e => setFormData({...formData, precio_total: parseFloat(e.target.value)})}
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depósito en Garantía
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.deposito_garantia}
                  onChange={e => setFormData({...formData, deposito_garantia: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugerido: {formData.moneda} {Math.round(formData.precio_total * 0.2)} (20%)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cláusula Penal Diaria
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.clausula_penal_diaria}
                  onChange={e => setFormData({...formData, clausula_penal_diaria: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Por cada día de mora en devolución
                </p>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creando...' : '✅ Crear Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
