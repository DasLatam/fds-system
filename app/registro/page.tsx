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
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'La contraseña debe contener al menos una minúscula';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'La contraseña debe contener al menos un número';
    }
    if (!/[!@#$%^&*]/.test(pwd)) {
      return 'La contraseña debe contener al menos un carácter especial (!@#$%^&*)';
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validar campos
      if (!email || !companyName) {
        throw new Error('Por favor completa todos los campos');
      }

      if (usePassword) {
        if (!password || !confirmPassword) {
          throw new Error('Por favor ingresa y confirma tu contraseña');
        }

        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }
      }

      const supabase = createClient();

      if (usePassword) {
        // Registro con contraseña
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              company_name: companyName
            }
          }
        });

        if (authError) throw authError;

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

        if (roleError) throw roleError;

        setMessage('✅ ¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        
        setTimeout(() => {
          router.push('/pending-approval');
        }, 3000);

      } else {
        // Registro con Magic Link
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: Math.random().toString(36).slice(-16), // Password temporal random
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              company_name: companyName
            }
          }
        });

        if (authError) throw authError;

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

        if (roleError) throw roleError;

        setMessage('✅ ¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
        
        setTimeout(() => {
          router.push('/pending-approval');
        }, 3000);
      }

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
              autoComplete="email"
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
              autoComplete="organization"
            />
          </div>

          {/* Toggle: ¿Quieres contraseña? */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="mr-3"
              />
              <span className="text-sm text-gray-700">
                Quiero establecer una contraseña ahora (opcional)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-6">
              Si no marcas esto, recibirás un enlace mágico para ingresar
            </p>
          </div>

          {usePassword && (
            <>
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
                  autoComplete="new-password"
                />
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p className={password.length >= 8 ? 'text-green-600' : ''}>
                    ✓ Mínimo 8 caracteres
                  </p>
                  <p className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Una mayúscula
                  </p>
                  <p className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Una minúscula
                  </p>
                  <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Un número
                  </p>
                  <p className={/[!@#$%^&*]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Un carácter especial (!@#$%^&*)
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
                  autoComplete="new-password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </>
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
                Registrando...
              </span>
            ) : (
              'Registrarse'
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