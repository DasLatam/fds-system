'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!org) {
        router.push('/pending-approval');
        return;
      }

      if (org.approved_status !== 'approved') {
        router.push('/pending-approval');
        return;
      }

      setOrganization(org);

      const { data: docs } = await supabase
        .from('documents')
        .select(`
          *,
          signers (
            id,
            name,
            email,
            signed_at
          )
        `)
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false });

      setDocuments(docs || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">FDS</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/user/perfil" className="text-gray-700 hover:text-indigo-600">
                👤 Mi Perfil
              </Link>
              <button onClick={handleLogout} className="btn-secondary">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">
            Bienvenido, {organization?.individual_name || organization?.company_name}
          </h2>
          <p className="text-gray-600 mt-2">Gestiona tus documentos para firma digital</p>
        </div>

        <div className="mb-6">
          <Link href="/dashboard/user/nuevo" className="btn-primary">
            + Nuevo Documento
          </Link>
        </div>

        <div className="grid gap-6">
          {documents.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-2">No hay documentos todavía</h3>
              <p className="text-gray-600 mb-6">Crea tu primer documento para comenzar</p>
              <Link href="/dashboard/user/nuevo" className="btn-primary">
                + Crear Primer Documento
              </Link>
            </div>
          ) : (
            documents.map((doc) => {
              const signedCount = doc.signers?.filter((s: any) => s.signed_at).length || 0;
              const totalSigners = doc.signers?.length || 0;
              const progress = totalSigners > 0 ? (signedCount / totalSigners) * 100 : 0;
              const isComplete = signedCount === totalSigners && totalSigners > 0;
              
              const expiresAt = new Date(doc.expires_at);
              const now = new Date();
              const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft < 0;

              return (
                <div key={doc.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {isComplete ? (
                        <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                          ✅ Completado
                        </span>
                      ) : isExpired ? (
                        <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                          ❌ Expirado
                        </span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                          ⏳ Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Progreso</div>
                      <div className="font-bold">{signedCount}/{totalSigners} Firmantes</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600">Vencimiento</div>
                      <div className="font-bold">
                        {isExpired ? (
                          <span className="text-red-600">Expirado</span>
                        ) : daysLeft === 0 ? (
                          <span className="text-yellow-600">Hoy</span>
                        ) : (
                          <span>{daysLeft} días</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600">Creado</div>
                      <div className="font-bold">
                        {new Date(doc.created_at).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/user/documento/${doc.id}`}
                      className="btn-primary flex-1 text-center"
                    >
                      Ver Detalles
                    </Link>
                    {doc.pdf_url && (
                      <a
                        href={doc.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        📥 PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
