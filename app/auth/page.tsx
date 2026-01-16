'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();

      if (mode === 'password') {
        // Login con contraseña
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        console.log('Login exitoso:', data.user?.email);
        
        // Redirigir según rol
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .single();

        if (roleData?.role === 'admin') {
          router.push('/dashboard/admin');
        } else if (roleData?.role === 'inmobiliaria') {
          router.push('/dashboard/inmobiliaria');
        } else if (roleData?.role === 'locador') {
          router.push('/dashboard/locador');
        } else if (roleData?.role === 'locatario') {
          router.push('/dashboard/locatario');
        } else {
          router.push('/');
        }

      } else {
        // Magic Link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`
          }
        });

        if (error) throw error;
        
        setMessage('✅ Email enviado! Revisa tu bandeja de entrada.');
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
                Ingresando...
              </span>
            ) : (
              mode === 'password' ? 'Ingresar con Contraseña' : 'Enviar Magic Link'
            )}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'password' ? 'magic' : 'password');
                setMessage('');
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              {mode === 'password' 
                ? '¿Prefieres usar Magic Link?' 
                : '¿Prefieres usar contraseña?'}
            </button>
          </div>
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