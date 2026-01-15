'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SignatureCanvas from 'react-signature-canvas';
import LegalConsentPopup from './LegalConsentPopup';

interface SignaturePageProps {
  token: string;
}

export default function SignaturePage({ token }: SignaturePageProps) {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<any>(null);
  const [role, setRole] = useState<'locador' | 'locatario' | null>(null);
  const [showConsentPopup, setShowConsentPopup] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    fetchContractData();
  }, [token]);
  
  const fetchContractData = async () => {
    try {
      const response = await fetch(`/api/signatures/verify?token=${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (data.expired) {
          setIsExpired(true);
        }
        throw new Error(data.error || 'Token inválido');
      }
      
      setContractData(data.contract);
      setRole(data.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const clearSignature = () => {
    signatureRef.current?.clear();
  };
  
  const handleReadyToSign = () => {
    if (signatureRef.current?.isEmpty()) {
      alert('Por favor, firma antes de continuar');
      return;
    }
    
    // Mostrar popup de consentimiento
    setShowConsentPopup(true);
  };
  
  const handleConsentAccepted = async () => {
    setShowConsentPopup(false);
    await handleSubmit();
  };
  
  const handleConsentDeclined = () => {
    setShowConsentPopup(false);
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      const signatureData = signatureRef.current?.toDataURL('image/png');
      
      const response = await fetch('/api/signatures/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signature: signatureData,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al firmar');
      }
      
      router.push(`/firma/exito?role=${role}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contrato...</p>
        </div>
      </div>
    );
  }
  
  if (error && !contractData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4">
        <div className="max-w-md w-full card text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isExpired ? 'Enlace Expirado' : 'Enlace Inválido'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpired 
              ? 'Este enlace de firma ha expirado (30 días). Por favor, contacta a la inmobiliaria para obtener un nuevo enlace.'
              : error
            }
          </p>
          <a href="/" className="btn-primary inline-block">
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }
  
  const roleText = role === 'locador' ? 'Locador' : 'Locatario';
  const myName = role === 'locador' ? contractData.locador_nombre : contractData.locatario_nombre;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Image src="/logo.png" alt="DasLATAM" width={60} height={60} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Firma de Contrato</h1>
              <p className="text-gray-600">FDS - Firma Digital Simple</p>
            </div>
          </div>
        </div>
        
        {/* Info del contrato */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Información del Contrato</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Tu rol:</p>
              <p className="text-gray-900 font-bold">{roleText}</p>
            </div>
            
            <div>
              <p className="text-gray-600 font-medium">Tu nombre:</p>
              <p className="text-gray-900 font-bold">{myName}</p>
            </div>
            
            <div className="md:col-span-2">
              <p className="text-gray-600 font-medium">Inmueble:</p>
              <p className="text-gray-900">{contractData.inmueble_direccion}</p>
            </div>
            
            <div>
              <p className="text-gray-600 font-medium">Período:</p>
              <p className="text-gray-900">
                {contractData.fecha_inicio} - {contractData.fecha_fin}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600 font-medium">Precio total:</p>
              <p className="text-gray-900 font-bold">
                {contractData.precio_moneda} {contractData.precio_total?.toLocaleString('es-AR')}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600 font-medium">Locador:</p>
              <p className="text-gray-900">{contractData.locador_nombre}</p>
            </div>
            
            <div>
              <p className="text-gray-600 font-medium">Locatario:</p>
              <p className="text-gray-900">{contractData.locatario_nombre}</p>
            </div>
          </div>
          
          {contractData.pdf_original_url && (
            <div className="mt-6 pt-6 border-t">
              <a 
                href={contractData.pdf_original_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Ver/Descargar Contrato Completo (PDF)
              </a>
            </div>
          )}
        </div>
        
        {/* Canvas de firma */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tu Firma</h2>
          <p className="text-gray-600 mb-4">
            Por favor, firma en el recuadro de abajo usando tu mouse, trackpad o dedo (en dispositivos táctiles).
          </p>
          
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'signature-canvas w-full h-48 bg-white rounded',
              }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={clearSignature}
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar firma
            </button>
            
            <button
              type="button"
              onClick={handleReadyToSign}
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Firmando...
                </span>
              ) : (
                'Confirmar y Firmar Contrato'
              )}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {/* Aviso legal */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p className="font-semibold mb-2">⚖️ Aviso Legal:</p>
          <p>
            Al firmar este documento, estás aceptando los términos y condiciones del contrato de alquiler temporario.
            La firma digital tiene el mismo valor legal que una firma manuscrita.
          </p>
        </div>
      </div>
      
      {/* Popup de Consentimiento Legal */}
      {showConsentPopup && contractData && role && (
        <LegalConsentPopup
          onAccept={handleConsentAccepted}
          onDecline={handleConsentDeclined}
          contractId={contractData.id}
          role={role}
        />
      )}
    </div>
  );
}
