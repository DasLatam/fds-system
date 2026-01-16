'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(pwd)) return 'Debe contener una mayúscula';
    if (!/[a-z]/.test(pwd)) return 'Debe contener una minúscula';
    if (!/[0-9]/.test(pwd)) return 'Debe contener un número';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!email || !companyName || !password || !confirmPassword) {
        throw new Error('Completa todos los campos');
      }

      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      const supabase = createClient();

      // Registro con confirmación de email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            company_name: companyName
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Crear rol de inmobiliaria
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          email: email,
          role: 'inmobiliaria',
          company_name: companyName,
          approved: false
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw roleError;
      }

      setMessage('✅ ¡Registro exitoso!\n\n📧 Revisa tu email (y carpeta de spam) para confirmar tu cuenta.\n\nDespués de confirmar, un administrador revisará tu solicitud.');

    } catch (error: any) {
      console.error('Registration error:', error);
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
            Registro de Inmobiliaria
          </h1>
          <p className="text-gray-600">Completa tus datos para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@inmobiliaria.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Inmobiliaria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Inmobiliaria SRL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
            <div className="mt-2 text-xs space-y-1">
              <p className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                {password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
              </p>
              <p className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                {/[A-Z]/.test(password) ? '✓' : '○'} Una mayúscula
              </p>
              <p className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                {/[a-z]/.test(password) ? '✓' : '○'} Una minúscula
              </p>
              <p className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                {/[0-9]/.test(password) ? '✓' : '○'} Un número
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm whitespace-pre-line ${
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
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}