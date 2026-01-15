'use client';

import Link from 'next/link';
import type { Contract } from '@/types';

interface ContractsListProps {
  contracts: Contract[];
}

export default function ContractsList({ contracts }: ContractsListProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contratos</h3>
        <p className="text-gray-600 mb-6">Crea tu primer contrato para comenzar</p>
        <Link href="/dashboard/inmobiliaria/nuevo-contrato" className="btn-primary inline-block">
          Crear Primer Contrato
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pendiente: 'badge-pending',
      firmado_parcial: 'badge-partial',
      firmado_completo: 'badge-complete',
      rechazado: 'badge-rejected',
      cancelado: 'badge-cancelled',
    };
    
    const labels = {
      pendiente: 'Pendiente',
      firmado_parcial: 'Firma Parcial',
      firmado_completo: 'Firmado',
      rechazado: 'Rechazado',
      cancelado: 'Cancelado',
    };

    return (
      <span className={`badge ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getSignatureStatus = (contract: Contract) => {
    const locadorFirmado = !!contract.locador_firmado_at;
    const locatarioFirmado = !!contract.locatario_firmado_at;

    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          {locadorFirmado ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          )}
          <span className={locadorFirmado ? 'text-green-700' : 'text-gray-600'}>Locador</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {locatarioFirmado ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          )}
          <span className={locatarioFirmado ? 'text-green-700' : 'text-gray-600'}>Locatario</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {contracts.map((contract) => (
        <Link 
          key={contract.id} 
          href={`/dashboard/inmobiliaria/contrato/${contract.id}`}
          className="block card hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  {contract.inmueble_direccion}
                </h3>
                {getStatusBadge(contract.status)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <p className="font-semibold text-gray-700">Locador:</p>
                  <p>{contract.locador_nombre}</p>
                  <p className="text-xs">{contract.locador_email}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-700">Locatario:</p>
                  <p>{contract.locatario_nombre}</p>
                  <p className="text-xs">{contract.locatario_email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-600">Período:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {contract.fecha_inicio} - {contract.fecha_fin} ({contract.plazo_noches} noches)
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {contract.precio_moneda} {contract.precio_total.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                {getSignatureStatus(contract)}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
