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
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      if (mode === 'magic') {
        // Magic Link (SIEMPRE usa Supabase SMTP -> Resend)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`
          }
        });

        if (error) throw error;

        setMessage('✅ ¡Email enviado! Revisa tu bandeja de entrada y haz click en el enlace.');
      } else {
        // Password
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        // Obtener rol
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, approved')
          .eq('user_id', authData.user.id)
          .single();

        if (!roleData) {
          setMessage('❌ Error: No tienes un rol asignado.');
          return;
        }

        // Redirigir según rol
        if (roleData.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (roleData.role === 'inmobiliaria') {
          router.push(roleData.approved ? '/dashboard/inmobiliaria' : '/pending-approval');
        } else if (roleData.role === 'locador') {
          router.push('/dashboard/locador');
        } else if (roleData.role === 'locatario') {
          router.push('/dashboard/locatario');
        }
      }

    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FDS - Firma Digital Simple
          </h1>
          <p className="text-gray-600">Ingresa a tu cuenta</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('magic');
              setMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === 'magic'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setMessage('');
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              mode === 'password'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Contraseña
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                autoComplete="current-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              mode === 'magic' ? '📧 Enviar Magic Link' : '🔐 Ingresar'
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Registrarse como Inmobiliaria
            </Link>
          </p>
        </div>

        {mode === 'magic' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> El enlace mágico es más seguro y no requiere recordar contraseña.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}