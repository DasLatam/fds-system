'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';

export default function FirmaPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [signer, setSigner] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const token = params.id as string;

      const { data: signerData } = await supabase
        .from('signers')
        .select('*, documents(*)')
        .eq('signature_token', token)
        .single();

      if (!signerData) {
        setError('Token inválido o expirado');
        return;
      }

      if (signerData.signed_at) {
        setError('Este documento ya fue firmado');
        return;
      }

      setSigner(signerData);
      setDocument(signerData.documents);
    } catch (err) {
      setError('Error al cargar el documento');
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!signer) return;
    setSigning(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('signers')
        .update({
          signed_at: new Date().toISOString(),
          signature_ip: 'browser_ip',
          signature_user_agent: navigator.userAgent,
        })
        .eq('id', signer.id);

      if (updateError) throw updateError;

      alert('✅ Documento firmado exitosamente');
      router.push('/firma-completada');
    } catch (err: any) {
      alert('Error al firmar: ' + err.message);
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-4">Firma Digital de Documento</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📄 Documento:</strong> {document?.title}
            </p>
            {document?.description && (
              <p className="text-sm text-blue-800 mt-2">{document.description}</p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Firmante:</strong> {signer.name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {signer.email}
            </p>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 mb-2">
              Al hacer clic en "Firmar Documento", confirmo que:
            </p>
            <ul className="text-sm text-gray-700 list-disc pl-6 space-y-1">
              <li>He leído y comprendido el contenido del documento</li>
              <li>Acepto los términos y condiciones del documento</li>
              <li>Mi firma digital tiene plena validez legal</li>
              <li>La información registrada (IP, fecha, hora) será almacenada</li>
            </ul>
          </div>

          <button
            onClick={handleSign}
            disabled={signing}
            className="btn-primary w-full"
          >
            {signing ? 'Firmando...' : '✍️ Firmar Documento'}
          </button>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>FDS - Firma Digital Simple</p>
          <p>Firma con validez legal según Ley 25.506</p>
        </div>
      </div>
    </div>
  );
}
