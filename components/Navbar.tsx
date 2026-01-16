'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const supabase = createClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUser(session.user);

    const { data: role } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    setUserRole(role);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
            <div>
              <div className="text-xl font-bold text-gray-900">FDS</div>
              <div className="text-xs text-gray-600">Firma Digital Simple</div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            {!user ? (
              <>
                <Link href="/auth" className="text-gray-700 hover:text-gray-900">
                  Ingresar
                </Link>
                <Link href="/registro" className="btn-primary">
                  Registrarse
                </Link>
              </>
            ) : (
              <>
                {userRole?.role === 'admin' && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Panel Admin
                  </Link>
                )}
                {userRole?.role === 'inmobiliaria' && (
                  <Link
                    href="/dashboard/inmobiliaria"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Mis Contratos
                  </Link>
                )}
                {userRole?.role === 'locador' && (
                  <Link
                    href="/dashboard/locador"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Mis Contratos
                  </Link>
                )}
                {userRole?.role === 'locatario' && (
                  <Link
                    href="/dashboard/locatario"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Mis Contratos
                  </Link>
                )}
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.email}
                    </div>
                    {userRole && (
                      <div className="text-xs text-gray-600 capitalize">
                        {userRole.role}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Salir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
