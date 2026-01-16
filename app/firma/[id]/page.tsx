'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FirmaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const token = searchParams.get('token');
  const tipo = searchParams.get('tipo') as 'locador' | 'locatario';

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContract();
  }, [resolvedParams.id, token]);

  async function loadContract() {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (error) throw error;

      // Verificar token
      const expectedToken = tipo === 'locador' 
        ? data.locador_firma_token 
        : data.locatario_firma_token;

      if (token !== expectedToken) {
        throw new Error('Token inválido o expirado');
      }

      // Verificar si ya firmó
      const yaFirmo = tipo === 'locador' 
        ? data.locador_firma_fecha 
        : data.locatario_firma_fecha;

      if (yaFirmo) {
        setError('Ya has firmado este contrato previamente');
        setContract(data);
        setLoading(false);
        return;
      }

      setContract(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFirmar() {
    if (!confirm('¿Confirmas que deseas firmar este contrato digitalmente?\n\nEsta acción es irreversible y tiene validez legal.')) {
      return;
    }

    setSigning(true);

    try {
      const supabase = createClient();

      // Registrar firma con metadata
      const firmaData = {
        fecha: new Date().toISOString(),
        ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip).catch(() => 'unknown'),
        user_agent: navigator.userAgent
      };

      // Actualizar firma
      const updates = tipo === 'locador'
        ? { 
            locador_firma_fecha: firmaData.fecha,
            locador_firma_ip: firmaData.ip,
            locador_firma_metadata: firmaData
          }
        : { 
            locatario_firma_fecha: firmaData.fecha,
            locatario_firma_ip: firmaData.ip,
            locatario_firma_metadata: firmaData
          };

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', resolvedParams.id);

      if (updateError) throw updateError;

      // Verificar si ambos firmaron
      const { data: updatedContract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (updatedContract.locador_firma_fecha && updatedContract.locatario_firma_fecha) {
        // Ambos firmaron, actualizar status y generar PDF
        await supabase
          .from('contracts')
          .update({ status: 'completed' })
          .eq('id', resolvedParams.id);

        // Llamar a API para generar PDF
        fetch('/api/contracts/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractId: resolvedParams.id })
        }).catch(console.error);
      }

      // Crear o hacer login del usuario automáticamente
      const email = tipo === 'locador' ? contract.locador_email : contract.locatario_email;
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/dashboard/${tipo}`,
          data: {
            auto_created: true,
            from_contract: resolvedParams.id
          }
        }
      });

      if (authError) console.error('Auth error:', authError);

      alert(
        '¡Contrato firmado exitosamente! ✅\n\n' +
        'Se ha registrado tu firma digital con validez legal.\n\n' +
        (updatedContract.locador_firma_fecha && updatedContract.locatario_firma_fecha
          ? 'Ambas partes han firmado. El PDF final será generado y enviado por email.'
          : 'Esperando la firma de la otra parte para completar el contrato.')
      );

      // Redirigir
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err: any) {
      alert(`Error al firmar: ${err.message}`);
      console.error('Error:', err);
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Contrato no encontrado'}</p>
          {error.includes('Ya has firmado') && contract && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                Este contrato ya fue firmado el{' '}
                {new Date(
                  tipo === 'locador' ? contract.locador_firma_fecha : contract.locatario_firma_fecha
                ).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
          <a href="/" className="btn-primary">
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  const yaFirmo = tipo === 'locador' ? contract.locador_firma_fecha : contract.locatario_firma_fecha;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✍️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Firma Digital de Contrato
            </h1>
            <p className="text-gray-600">
              Sistema con validez legal según Ley 25.506
            </p>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 font-medium text-center">
              <strong>Estás firmando como:</strong>{' '}
              {tipo === 'locador' ? '👤 Locador (Propietario)' : '👥 Locatario (Inquilino)'}
            </p>
          </div>

          {/* Detalles del Contrato */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">🏠</span>
                Detalles del Inmueble
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Dirección:</p>
                  <p className="text-gray-900 font-medium">{contract.inmueble_direccion}</p>
                </div>
                <div>
                  <p className="text-gray-600">Barrio y Lote:</p>
                  <p className="text-gray-900 font-medium">
                    {contract.inmueble_barrio}, Lote {contract.inmueble_lote}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">📅</span>
                Período de Alquiler
              </h3>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Inicio:</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(contract.fecha_inicio).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Fin:</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(contract.fecha_fin).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Duración:</p>
                  <p className="text-gray-900 font-medium">{contract.noches} noches</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">💰</span>
                Información Financiera
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Precio Total:</p>
                  <p className="text-gray-900 font-bold text-lg">
                    {contract.moneda} {contract.precio_total.toLocaleString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Depósito en Garantía:</p>
                  <p className="text-gray-900 font-medium">
                    {contract.moneda} {contract.deposito_garantia.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">👥</span>
                Partes del Contrato
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Locador:</p>
                  <p className="text-gray-900 font-medium">{contract.locador_nombre}</p>
                  <p className="text-gray-600 text-xs">DNI: {contract.locador_dni}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Locatario:</p>
                  <p className="text-gray-900 font-medium">{contract.locatario_nombre}</p>
                  <p className="text-gray-600 text-xs">DNI: {contract.locatario_dni}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Firmas */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-3">Estado de las Firmas:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800">Locador:</span>
                <span className={contract.locador_firma_fecha ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  {contract.locador_firma_fecha ? '✅ Firmado' : '⏳ Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-800">Locatario:</span>
                <span className={contract.locatario_firma_fecha ? 'text-green-600 font-medium' : 'text-gray-600'}>
                  {contract.locatario_firma_fecha ? '✅ Firmado' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Legal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <span className="mr-2">⚖️</span>
              Validez Legal
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Tu firma digital tendrá plena validez legal según:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• <strong>Ley 25.506</strong> - Firma Digital</li>
              <li>• <strong>Art. 288 del Código Civil y Comercial</strong></li>
            </ul>
            <p className="text-xs text-blue-700 mt-3">
              Se registrará: fecha, hora, IP y metadatos de la firma para garantizar su autenticidad.
            </p>
          </div>

          {/* Botón de Firma */}
          {!yaFirmo && (
            <button
              onClick={handleFirmar}
              disabled={signing}
              className="btn-primary w-full text-lg py-4 flex items-center justify-center"
            >
              {signing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Firmando...
                </>
              ) : (
                <>
                  <span className="text-2xl mr-2">✍️</span>
                  Firmar Digitalmente Este Contrato
                </>
              )}
            </button>
          )}

          <p className="text-xs text-center text-gray-500 mt-4">
            Al firmar, aceptas los términos y condiciones del contrato.
            Esta acción es irreversible.
          </p>
        </div>
      </div>
    </div>
  );
}
