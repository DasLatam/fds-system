'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DocumentoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<any>(null);
  const [signers, setSigners] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    loadDocument();
  }, []);

  async function loadDocument() {
    try {
      const supabase = createClient();
      const documentId = params.id as string;

      // Get document
      const { data: doc } = await supabase
        .from('documents')
        .select('*, organizations(*)')
        .eq('id', documentId)
        .single();

      if (!doc) {
        router.push('/dashboard/user');
        return;
      }

      setDocument(doc);
      setOrganization(doc.organizations);

      // Get signers
      const { data: signersData } = await supabase
        .from('signers')
        .select('*')
        .eq('document_id', documentId)
        .order('signing_order');

      setSigners(signersData || []);
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setLoading(false);
    }
  }

  async function resendInvitations() {
    if (!confirm('¿Reenviar invitaciones a los firmantes pendientes?')) return;

    try {
      const response = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (response.ok) {
        alert('✅ Invitaciones reenviadas');
      } else {
        alert('❌ Error al enviar invitaciones');
      }
    } catch (error) {
      alert('❌ Error al enviar invitaciones');
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

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Documento no encontrado</h1>
          <Link href="/dashboard/user" className="btn-primary">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const signedCount = signers.filter(s => s.signed_at).length;
  const totalSigners = signers.length;
  const progress = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;
  const isComplete = signedCount === totalSigners && totalSigners > 0;
  
  const expiresAt = new Date(document.expires_at);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft < 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/user" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold">{document.title}</h1>
          {document.description && (
            <p className="text-gray-600 mt-2">{document.description}</p>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Estado</div>
            <div className="font-bold text-lg">
              {isComplete ? (
                <span className="text-green-600">✅ Completado</span>
              ) : isExpired ? (
                <span className="text-red-600">❌ Expirado</span>
              ) : (
                <span className="text-yellow-600">⏳ Pendiente</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Progreso</div>
            <div className="font-bold text-lg">{signedCount}/{totalSigners} Firmantes</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Vencimiento</div>
            <div className="font-bold text-lg">
              {isExpired ? (
                <span className="text-red-600">Expirado</span>
              ) : daysLeft === 0 ? (
                <span className="text-yellow-600">Hoy</span>
              ) : daysLeft === 1 ? (
                <span className="text-yellow-600">Mañana</span>
              ) : (
                <span>{daysLeft} días</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {expiresAt.toLocaleDateString('es-AR')}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Creado</div>
            <div className="font-bold text-lg">
              {new Date(document.created_at).toLocaleDateString('es-AR')}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(document.created_at).toLocaleTimeString('es-AR')}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PDF Viewer */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">📄 Documento PDF</h2>
            
            {document.pdf_url ? (
              <>
                <div className="border rounded-lg overflow-hidden mb-4" style={{ height: '600px' }}>
                  <iframe
                    src={document.pdf_url}
                    className="w-full h-full"
                    title="Documento PDF"
                  />
                </div>

                <div className="flex gap-2">
                  <a
                    href={document.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex-1"
                  >
                    📥 Descargar PDF Original
                  </a>
                  
                  {isComplete && (
                    <button className="btn-primary flex-1">
                      📥 Descargar PDF Firmado
                    </button>
                  )}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Archivo:</strong> {document.original_filename}</p>
                  <p><strong>Tamaño:</strong> {(document.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">PDF no disponible</p>
              </div>
            )}
          </div>

          {/* Signers List */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">✍️ Firmantes ({totalSigners})</h2>
                {!isComplete && !isExpired && (
                  <button
                    onClick={resendInvitations}
                    className="btn-secondary text-sm"
                  >
                    📧 Reenviar
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {signers.map((signer, index) => (
                  <div
                    key={signer.id}
                    className={`border rounded-lg p-4 ${
                      signer.signed_at ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{index + 1}. {signer.name}</span>
                          {signer.signed_at ? (
                            <span className="text-green-600 text-xl">✓</span>
                          ) : (
                            <span className="text-yellow-600 text-xl">⏳</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{signer.email}</p>
                        {signer.role && (
                          <p className="text-xs text-gray-500 mt-1">Rol: {signer.role}</p>
                        )}
                      </div>
                    </div>

                    {signer.signed_at ? (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">
                          ✅ Firmado el {new Date(signer.signed_at).toLocaleDateString('es-AR')} a las{' '}
                          {new Date(signer.signed_at).toLocaleTimeString('es-AR')}
                        </p>
                        {signer.signature_metadata && (
                          <div className="mt-2 text-xs text-gray-500">
                            <p>DNI: {signer.signature_metadata.dni}</p>
                            <p>Celular: {signer.signature_metadata.phone}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">
                          {signer.invitation_sent_at ? (
                            <>📧 Invitación enviada el {new Date(signer.invitation_sent_at).toLocaleDateString('es-AR')}</>
                          ) : (
                            <>⏳ Invitación pendiente</>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Legal */}
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-bold mb-3">🛡️ Validez Legal</h3>
              <p className="text-sm text-gray-700 mb-2">
                Este documento cumple con:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Ley 25.506 de Firma Digital</li>
                <li>✅ Arts. 286-288 Código Civil y Comercial</li>
                <li>✅ Registro forense de cada firma</li>
                <li>✅ Timestamp certificado</li>
              </ul>
            </div>

            {/* Metadata */}
            <div className="card bg-gray-50">
              <h3 className="font-bold mb-3">📊 Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID del Documento:</span>
                  <span className="font-mono text-xs">{document.id.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Organización:</span>
                  <span>{organization?.company_name || organization?.individual_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="capitalize">{document.document_type?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isComplete && (
          <div className="card mt-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-green-800 mb-1">
                  ✅ Documento Completado
                </h3>
                <p className="text-sm text-green-700">
                  Todas las partes han firmado. El documento tiene plena validez legal.
                </p>
              </div>
              <button className="btn-primary">
                📥 Descargar Certificado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
