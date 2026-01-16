'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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

      // Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      console.log('✅ Login exitoso');
      console.log('User ID:', authData.user.id);
      console.log('Email:', authData.user.email);

      // Obtener rol
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, approved')
        .eq('user_id', authData.user.id)
        .single();

      console.log('Role data:', roleData);
      console.log('Role error:', roleError);

      if (roleError || !roleData) {
        console.error('❌ No se encontró rol para user_id:', authData.user.id);
        setMessage(`❌ Error: No tienes un rol asignado. User ID: ${authData.user.id}`);
        return;
      }

      // Redirigir según rol
      console.log('✅ Rol encontrado:', roleData.role);

      if (roleData.role === 'admin') {
        console.log('➡️ Redirigiendo a /dashboard/admin');
        router.push('/dashboard/admin');
      } else if (roleData.role === 'inmobiliaria') {
        if (!roleData.approved) {
          router.push('/pending-approval');
        } else {
          router.push('/dashboard/inmobiliaria');
        }
      } else if (roleData.role === 'locador') {
        router.push('/dashboard/locador');
      } else if (roleData.role === 'locatario') {
        router.push('/dashboard/locatario');
      } else {
        router.push('/');
      }

    } catch (error: any) {
      console.error('❌ Auth error:', error);
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
            />
          </div>

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
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              <pre className="whitespace-pre-wrap font-mono text-xs">
                {message}
              </pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}