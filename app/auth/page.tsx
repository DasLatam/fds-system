'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (!org) {
        setMessage('No se encontró tu organización');
        return;
      }

      if (!org.approved && org.role !== 'admin') {
        router.push('/pending-approval');
        return;
      }

      if (org.role === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/user');
      }

    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">Iniciar Sesión</h1>
        <p className="text-gray-600 text-center mb-8">FDS - Firma Digital Simple</p>

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

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          {message && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm">
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
