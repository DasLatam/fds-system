'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LegalConsentPopupProps {
  onAccept: () => void;
  onDecline: () => void;
  contractId: string;
  role: 'locador' | 'locatario';
}

export default function LegalConsentPopup({ 
  onAccept, 
  onDecline, 
  contractId, 
  role 
}: LegalConsentPopupProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedLegalEffect, setAcceptedLegalEffect] = useState(false);
  
  const canProceed = acceptedTerms && acceptedPrivacy && acceptedLegalEffect;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Consentimiento Legal</h2>
              <p className="text-indigo-100 text-sm">Firma Digital Simple - DasLATAM</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 leading-relaxed">
              Antes de firmar este contrato, es necesario que leas y aceptes los siguientes términos legales.
              Tu firma digital tendrá <strong>plena validez legal</strong> según la Ley 25.506 de Firma Digital
              de la República Argentina.
            </p>
          </div>

          {/* Checkbox 1: Términos y Condiciones */}
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <p className="text-gray-900 font-medium group-hover:text-indigo-600">
                He leído y acepto los{' '}
                <Link 
                  href="/legal/terminos" 
                  target="_blank"
                  className="text-indigo-600 hover:text-indigo-700 underline"
                >
                  Términos y Condiciones
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Incluye las condiciones de uso del servicio de firma digital.
              </p>
            </div>
          </label>

          {/* Checkbox 2: Política de Privacidad */}
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <p className="text-gray-900 font-medium group-hover:text-indigo-600">
                He leído y acepto la{' '}
                <Link 
                  href="/legal/privacidad" 
                  target="_blank"
                  className="text-indigo-600 hover:text-indigo-700 underline"
                >
                  Política de Privacidad
                </Link>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Tus datos serán tratados conforme a la Ley 25.326 de Protección de Datos Personales.
              </p>
            </div>
          </label>

          {/* Checkbox 3: Efecto Legal de la Firma */}
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acceptedLegalEffect}
              onChange={(e) => setAcceptedLegalEffect(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="flex-1">
              <p className="text-gray-900 font-medium group-hover:text-indigo-600">
                Comprendo el efecto legal de mi firma digital
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Entiendo que mi firma digital tendrá la misma validez jurídica que una firma manuscrita
                según el Art. 288 del Código Civil y Comercial y la Ley 25.506.
              </p>
            </div>
          </label>

          {/* Info adicional */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
            <p className="font-semibold">📋 Información importante:</p>
            <ul className="space-y-1 ml-5 list-disc">
              <li>Tu firma será registrada con fecha, hora e IP</li>
              <li>El contrato firmado tendrá valor probatorio en juicio</li>
              <li>Esta acción es irreversible una vez confirmada</li>
              <li>Recibirás una copia del contrato firmado por email</li>
            </ul>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-between items-center border-t">
          <button
            onClick={onDecline}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancelar
          </button>
          
          <button
            onClick={onAccept}
            disabled={!canProceed}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {canProceed ? (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Acepto y Continuar
              </span>
            ) : (
              'Debes aceptar todos los términos'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
