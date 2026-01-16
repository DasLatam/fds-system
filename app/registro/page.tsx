'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    companyName: '',
    tipoUsuario: 'inmobiliaria' as 'inmobiliaria' | 'otro'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const supabase = createClient();
      
      if (formData.tipoUsuario === 'inmobiliaria') {
        // Validación
        if (!formData.companyName.trim()) {
          throw new Error('El nombre de la inmobiliaria es requerido');
        }

        // Enviar magic link
        const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?tipo=inmobiliaria&company=${encodeURIComponent(formData.companyName)}`,
            data: {
              full_name: formData.nombre,
              company_name: formData.companyName,
              role: 'inmobiliaria'
            }
          }
        });

        if (error) throw error;

        setMessageType('success');
        setMessage(
          'Te hemos enviado un enlace de confirmación a tu email. ' +
          'Después de confirmar tu email, tu cuenta será revisada por un administrador. ' +
          'Recibirás un email cuando tu cuenta sea aprobada.'
        );
        
      } else {
        // Locador o locatario
        setMessageType('info');
        setMessage(
          'Los locadores y locatarios no pueden registrarse directamente. ' +
          'Serás agregado automáticamente cuando tu inmobiliaria cree un contrato para ti. ' +
          'Recibirás un email con un enlace para firmar el contrato.'
        );
      }
    } catch (error: any) {
      setMessageType('error');
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.png" alt="DasLATAM" width={50} height={50} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FDS</h1>
              <p className="text-xs text-gray-600">Firma Digital Simple</p>
            </div>
          </Link>
          <Link href="/auth" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-12">
        <div className="card max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registro
            </h1>
            <p className="text-gray-600">
              Crea tu cuenta en FDS - Firma Digital Simple
            </p>
          </div>

          <form onSubmit={handleRegistro} className="space-y-6">
            {/* Tipo de Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Qué tipo de usuario eres? *
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                <label 
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.tipoUsuario === 'inmobiliaria'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="inmobiliaria"
                    checked={formData.tipoUsuario === 'inmobiliaria'}
                    onChange={() => setFormData({...formData, tipoUsuario: 'inmobiliaria'})}
                    className="mt-1 mr-3"
                    required
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      🏢 Inmobiliaria
                    </div>
                    <div className="text-sm text-gray-600">
                      Gestiono contratos de alquiler para mis clientes. 
                      Necesito aprobación de un administrador.
                    </div>
                  </div>
                </label>
                
                <label 
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.tipoUsuario === 'otro'
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value="otro"
                    checked={formData.tipoUsuario === 'otro'}
                    onChange={() => setFormData({...formData, tipoUsuario: 'otro'})}
                    className="mt-1 mr-3"
                    required
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      👤 Locador / Locatario
                    </div>
                    <div className="text-sm text-gray-600">
                      Quiero firmar contratos de alquiler. 
                      Seré agregado por mi inmobiliaria.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Campos para Inmobiliaria */}
            {formData.tipoUsuario === 'inmobiliaria' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Inmobiliaria *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    required
                    className="input-field"
                    placeholder="Ej: Inmobiliaria Costa Esmeralda"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este nombre aparecerá en los contratos que generes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    className="input-field"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Corporativo *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="input-field"
                    placeholder="contacto@tuinmobiliaria.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preferentemente usa un email corporativo de tu inmobiliaria
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <span className="mr-2">ℹ️</span>
                    Proceso de Aprobación
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">1.</span>
                      <span>Te enviaremos un email para confirmar tu dirección</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">2.</span>
                      <span>Un administrador revisará tu solicitud (24-48 hs)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">3.</span>
                      <span>Recibirás un email cuando tu cuenta sea aprobada</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">4.</span>
                      <span>Podrás comenzar a crear contratos inmediatamente</span>
                    </li>
                  </ol>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-lg py-4"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    '🚀 Registrar Inmobiliaria'
                  )}
                </button>
              </>
            )}

            {/* Mensaje para Locador/Locatario */}
            {formData.tipoUsuario === 'otro' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="text-4xl mr-4">👤</div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      No necesitas registrarte
                    </h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      Si eres <strong>locador (propietario)</strong> o <strong>locatario (inquilino)</strong>, 
                      no necesitas crear una cuenta manualmente.
                    </p>
                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700 font-medium mb-2">
                        ¿Cómo funciona?
                      </p>
                      <ol className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-yellow-600">1.</span>
                          <span>Tu inmobiliaria creará un contrato con tus datos</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-yellow-600">2.</span>
                          <span>Recibirás un email con un enlace único para firmar</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-yellow-600">3.</span>
                          <span>Al hacer clic, tu cuenta se creará automáticamente</span>
                        </li>
                        <li className="flex items-start">
                          <span className="font-semibold mr-2 text-yellow-600">4.</span>
                          <span>Después podrás ingresar con tu email para ver tus contratos</span>
                        </li>
                      </ol>
                    </div>
                    <p className="text-sm text-yellow-800">
                      <strong>¿Tienes dudas?</strong> Consulta con tu inmobiliaria o escríbenos a{' '}
                      <a href="mailto:firmadigitalsimple@daslatam.org" className="underline">
                        firmadigitalsimple@daslatam.org
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de respuesta */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-start">
                  <div className="mr-3 text-2xl">
                    {messageType === 'success' && '✅'}
                    {messageType === 'error' && '⚠️'}
                    {messageType === 'info' && 'ℹ️'}
                  </div>
                  <p className="text-sm flex-1">{message}</p>
                </div>
              </div>
            )}

            {/* Link a login */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Ingresar aquí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
