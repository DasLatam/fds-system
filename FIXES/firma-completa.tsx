'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FirmaPage() {
  const params = useParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signer, setSigner] = useState<any>(null);
  const [document, setDocument] = useState<any>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Datos, 2: Ver PDF, 3: Firmar

  // Datos del firmante
  const [signerDni, setSignerDni] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [signerPhone, setSignerPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Firma con trazo
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      setupCanvas();
    }
  }, [step]);

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
        setError('Este documento ya fue firmado por ti');
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

  function setupCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Setup drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }

  async function handleSign() {
    if (!signer) return;
    setSigning(true);

    try {
      // Validar firma
      if (!hasSignature) {
        throw new Error('Debes firmar en el recuadro');
      }

      const supabase = createClient();

      // Convertir canvas a imagen
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Error al capturar la firma');

      const signatureImage = canvas.toDataURL('image/png');

      // Actualizar firmante
      const { error: updateError } = await supabase
        .from('signers')
        .update({
          signed_at: new Date().toISOString(),
          signature_ip: 'browser_ip', // En producción, obtener IP real
          signature_user_agent: navigator.userAgent,
          signature_metadata: {
            dni: signerDni,
            address: signerAddress,
            phone: signerPhone,
            signature_image: signatureImage,
          },
        })
        .eq('id', signer.id);

      if (updateError) throw updateError;

      // Verificar si todos firmaron
      const { data: allSigners } = await supabase
        .from('signers')
        .select('signed_at')
        .eq('document_id', document.id);

      const allSigned = allSigners?.every(s => s.signed_at != null);

      if (allSigned) {
        // Enviar emails de confirmación a todos
        await fetch('/api/send-completion-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id }),
        });
      }

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
        {/* Header */}
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-4">Firma Digital de Documento</h1>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>📄 Documento:</strong> {document?.title}
            </p>
            {document?.description && (
              <p className="text-sm text-blue-800 mt-2">{document.description}</p>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Firmante:</strong> {signer.name} ({signer.email})
            </p>
            {signer.role && (
              <p className="text-sm text-gray-600">
                <strong>Rol:</strong> {signer.role}
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 text-sm">Datos</span>
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 text-sm">Ver PDF</span>
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 text-sm">Firmar</span>
            </div>
          </div>
        </div>

        {/* Step 1: Datos Personales */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Tus Datos Personales</h2>
            <p className="text-gray-600 mb-6">
              Para darle validez legal a tu firma, necesitamos algunos datos adicionales:
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">DNI *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="12345678"
                  value={signerDni}
                  onChange={(e) => setSignerDni(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Dirección *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Calle 123, Ciudad"
                  value={signerAddress}
                  onChange={(e) => setSignerAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Celular *</label>
                <input
                  type="tel"
                  required
                  className="input-field"
                  placeholder="+54 9 11 1234-5678"
                  value={signerPhone}
                  onChange={(e) => setSignerPhone(e.target.value)}
                />
              </div>

              <div className="flex items-start gap-3 mt-6">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  Acepto los{' '}
                  <Link href="/legal/terminos" target="_blank" className="text-indigo-600 hover:underline">
                    Términos y Condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link href="/legal/privacidad" target="_blank" className="text-indigo-600 hover:underline">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!signerDni || !signerAddress || !signerPhone || !acceptTerms}
              className="btn-primary w-full mt-6"
            >
              Siguiente: Ver Documento →
            </button>
          </div>
        )}

        {/* Step 2: Ver PDF */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Revisar Documento</h2>
            
            {document?.pdf_url ? (
              <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={document.pdf_url}
                  className="w-full h-full"
                  title="Documento PDF"
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">PDF no disponible para preview</p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Atrás
              </button>
              <button onClick={() => setStep(3)} className="btn-primary">
                Siguiente: Firmar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Firmar */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Firmar Documento</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Dibuja tu firma en el recuadro de abajo usando el mouse o touch:
              </p>
              
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair"
                  style={{ height: '200px' }}
                />
              </div>

              <button
                onClick={clearSignature}
                className="btn-secondary mt-2"
              >
                🔄 Limpiar Firma
              </button>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                Al hacer clic en "Firmar Documento", confirmo que:
              </p>
              <ul className="text-sm text-gray-700 list-disc pl-6 space-y-1">
                <li>He leído y comprendido el contenido del documento</li>
                <li>Acepto los términos y condiciones del documento</li>
                <li>Mi firma digital tiene plena validez legal según Ley 25.506</li>
                <li>La información registrada (IP, fecha, hora, firma) será almacenada</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                ← Atrás
              </button>
              <button
                onClick={handleSign}
                disabled={signing || !hasSignature}
                className="btn-primary"
              >
                {signing ? 'Firmando...' : '✍️ Firmar Documento'}
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-8">
          <p>FDS - Firma Digital Simple</p>
          <p>Firma con validez legal según Ley 25.506</p>
        </div>
      </div>
    </div>
  );
}
