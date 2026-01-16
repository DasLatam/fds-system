'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkApprovalStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkApprovalStatus() {
    try {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error:', error);
        return;
      }

      setUserInfo(roleData);

      // Si fue aprobado, redirigir al dashboard
      if (roleData.approved) {
        if (roleData.role === 'inmobiliaria') {
          router.push('/dashboard/inmobiliaria');
        } else if (roleData.role === 'admin') {
          router.push('/dashboard/admin');
        }
      }

      // Si fue rechazado
      if (roleData.rejection_reason) {
        // Mostrar razón del rechazo
      }

    } catch (error) {
      console.error('Error checking approval:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado...</p>
        </div>
      </div>
    );
  }

  if (userInfo?.rejection_reason) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Solicitud Rechazada
          </h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud de registro como inmobiliaria ha sido rechazada.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 font-medium mb-2">Razón del rechazo:</p>
            <p className="text-red-900">{userInfo.rejection_reason}</p>
          </div>
          <p className="text-gray-600 mb-6">
            Si crees que esto es un error, puedes contactarnos a{' '}
            <a href="mailto:firmadigitalsimple@daslatam.org" className="text-indigo-600 hover:underline">
              firmadigitalsimple@daslatam.org
            </a>
          </p>
          <button onClick={handleLogout} className="btn-secondary">
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="card max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-6 animate-pulse">⏳</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Cuenta Pendiente de Aprobación
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Tu solicitud está siendo revisada por nuestro equipo
            </p>

            {userInfo && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-4">Información de tu cuenta:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{userInfo.email}</span>
                  </div>
                  {userInfo.company_name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inmobiliaria:</span>
                      <span className="font-medium">{userInfo.company_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium capitalize">{userInfo.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registrado:</span>
                    <span className="font-medium">
                      {new Date(userInfo.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                ¿Qué sigue?
              </h3>
              <ol className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-blue-600">1.</span>
                  <span>
                    Un administrador revisará tu solicitud (generalmente dentro de 24-48 horas)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-blue-600">2.</span>
                  <span>
                    Verificaremos que seas una inmobiliaria legítima
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-blue-600">3.</span>
                  <span>
                    Recibirás un email cuando tu cuenta sea aprobada
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-3 text-blue-600">4.</span>
                  <span>
                    Podrás ingresar y comenzar a crear contratos inmediatamente
                  </span>
                </li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-yellow-800">
                <strong>💡 Tip:</strong> Esta página se actualiza automáticamente cada 30 segundos. 
                También puedes cerrarla y volver más tarde.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={checkApprovalStatus} 
                className="btn-secondary"
              >
                🔄 Verificar Ahora
              </button>
              <button onClick={handleLogout} className="btn-secondary">
                Salir
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-8">
              ¿Necesitas ayuda? Escríbenos a{' '}
              <a 
                href="mailto:firmadigitalsimple@daslatam.org" 
                className="text-indigo-600 hover:underline"
              >
                firmadigitalsimple@daslatam.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
