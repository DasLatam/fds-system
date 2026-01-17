'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: org } = await supabase
        .from('organizations')
        .select('approved_status, is_admin')
        .eq('user_id', user.id)
        .single();

      if (!org) {
        router.push('/pending-approval');
        return;
      }

      if (org.is_admin) {
        router.push('/dashboard/admin');
      } else if (org.approved_status === 'approved') {
        router.push('/dashboard/user');
      } else {
        router.push('/pending-approval');
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con link de vuelta */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-3xl">✍️</div>
            <h1 className="text-2xl font-bold text-indigo-600">FDS</h1>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center py-12 px-4">
        <div className="card max-w-md w-full">
          <h2 className="text-3xl font-bold mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600 mb-6">FDS - Firma Digital Simple</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            {message && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
                {message}
              </div>
            )}

            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/registro" className="text-indigo-600 hover:underline">
                Crear Cuenta
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/legal/terminos" className="hover:text-white">
              Términos y Condiciones
            </Link>
            <Link href="/legal/privacidad" className="hover:text-white">
              Política de Privacidad
            </Link>
          </div>
          <p>© 2026 DasLATAM. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
