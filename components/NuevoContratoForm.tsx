'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevoContratoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Locador
    locador_nombre: '',
    locador_dni: '',
    locador_domicilio: '',
    locador_email: '',
    
    // Locatario
    locatario_nombre: '',
    locatario_dni: '',
    locatario_domicilio: '',
    locatario_email: '',
    
    // Inmueble
    inmueble_direccion: '',
    inmueble_barrio: '',
    inmueble_lote: '',
    inmueble_partido: '',
    inmueble_provincia: 'Buenos Aires',
    
    // Contrato
    plazo_noches: '',
    fecha_inicio: '',
    hora_inicio: '16:00',
    fecha_fin: '',
    hora_fin: '10:00',
    precio_total: '',
    precio_moneda: 'USD',
    max_personas: '8',
    deposito_garantia: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el contrato');
      }

      // Redirigir al dashboard
      router.push('/dashboard/inmobiliaria');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/inmobiliaria" className="text-indigo-600 hover:text-indigo-700 font-medium">
          ← Volver al dashboard
        </Link>
      </div>

      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Nuevo Contrato de Alquiler</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* DATOS DEL LOCADOR */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-indigo-500">
              Datos del Locador
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="locador_nombre" className="label">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="locador_nombre"
                  name="locador_nombre"
                  value={formData.locador_nombre}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="locador_dni" className="label">
                  DNI *
                </label>
                <input
                  type="text"
                  id="locador_dni"
                  name="locador_dni"
                  value={formData.locador_dni}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12.345.678"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locador_domicilio" className="label">
                  Domicilio *
                </label>
                <input
                  type="text"
                  id="locador_domicilio"
                  name="locador_domicilio"
                  value={formData.locador_domicilio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Calle 123, Ciudad, Provincia"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locador_email" className="label">
                  Email *
                </label>
                <input
                  type="email"
                  id="locador_email"
                  name="locador_email"
                  value={formData.locador_email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="locador@email.com"
                  required
                />
              </div>
            </div>
          </section>

          {/* DATOS DEL LOCATARIO */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-500">
              Datos del Locatario
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="locatario_nombre" className="label">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="locatario_nombre"
                  name="locatario_nombre"
                  value={formData.locatario_nombre}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="locatario_dni" className="label">
                  DNI *
                </label>
                <input
                  type="text"
                  id="locatario_dni"
                  name="locatario_dni"
                  value={formData.locatario_dni}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12.345.678"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locatario_domicilio" className="label">
                  Domicilio *
                </label>
                <input
                  type="text"
                  id="locatario_domicilio"
                  name="locatario_domicilio"
                  value={formData.locatario_domicilio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Calle 123, Ciudad, Provincia"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locatario_email" className="label">
                  Email *
                </label>
                <input
                  type="email"
                  id="locatario_email"
                  name="locatario_email"
                  value={formData.locatario_email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="locatario@email.com"
                  required
                />
              </div>
            </div>
          </section>

          {/* DATOS DEL INMUEBLE */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
              Datos del Inmueble
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="inmueble_direccion" className="label">
                  Dirección completa *
                </label>
                <input
                  type="text"
                  id="inmueble_direccion"
                  name="inmueble_direccion"
                  value={formData.inmueble_direccion}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: COSTA ESMERALDA Km 380 de la Ruta 11"
                  required
                />
              </div>

              <div>
                <label htmlFor="inmueble_barrio" className="label">
                  Barrio *
                </label>
                <input
                  type="text"
                  id="inmueble_barrio"
                  name="inmueble_barrio"
                  value={formData.inmueble_barrio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: SENDEROS IV"
                  required
                />
              </div>

              <div>
                <label htmlFor="inmueble_lote" className="label">
                  Lote *
                </label>
                <input
                  type="text"
                  id="inmueble_lote"
                  name="inmueble_lote"
                  value={formData.inmueble_lote}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: 388"
                  required
                />
              </div>

              <div>
                <label htmlFor="inmueble_partido" className="label">
                  Partido *
                </label>
                <input
                  type="text"
                  id="inmueble_partido"
                  name="inmueble_partido"
                  value={formData.inmueble_partido}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Ej: Partido de la Costa"
                  required
                />
              </div>

              <div>
                <label htmlFor="inmueble_provincia" className="label">
                  Provincia *
                </label>
                <input
                  type="text"
                  id="inmueble_provincia"
                  name="inmueble_provincia"
                  value={formData.inmueble_provincia}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </section>

          {/* DATOS DEL CONTRATO */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">
              Datos del Contrato
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fecha_inicio" className="label">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  id="fecha_inicio"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="hora_inicio" className="label">
                  Hora de inicio *
                </label>
                <input
                  type="time"
                  id="hora_inicio"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="fecha_fin" className="label">
                  Fecha de fin *
                </label>
                <input
                  type="date"
                  id="fecha_fin"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="hora_fin" className="label">
                  Hora de fin *
                </label>
                <input
                  type="time"
                  id="hora_fin"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="plazo_noches" className="label">
                  Cantidad de noches *
                </label>
                <input
                  type="number"
                  id="plazo_noches"
                  name="plazo_noches"
                  value={formData.plazo_noches}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="max_personas" className="label">
                  Máximo de personas *
                </label>
                <input
                  type="number"
                  id="max_personas"
                  name="max_personas"
                  value={formData.max_personas}
                  onChange={handleChange}
                  className="input-field"
                  min="1"
                  required
                />
              </div>

              <div>
                <label htmlFor="precio_moneda" className="label">
                  Moneda *
                </label>
                <select
                  id="precio_moneda"
                  name="precio_moneda"
                  value={formData.precio_moneda}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="USD">Dólares (USD)</option>
                  <option value="ARS">Pesos (ARS)</option>
                </select>
              </div>

              <div>
                <label htmlFor="precio_total" className="label">
                  Precio total *
                </label>
                <input
                  type="number"
                  id="precio_total"
                  name="precio_total"
                  value={formData.precio_total}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="deposito_garantia" className="label">
                  Depósito de garantía *
                </label>
                <input
                  type="number"
                  id="deposito_garantia"
                  name="deposito_garantia"
                  value={formData.deposito_garantia}
                  onChange={handleChange}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </section>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Link href="/dashboard/inmobiliaria" className="btn-secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando contrato...
                </span>
              ) : (
                'Crear Contrato y Enviar para Firmar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
