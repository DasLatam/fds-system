'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Datos comunes
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Datos INDIVIDUAL
  const [individualName, setIndividualName] = useState('');
  const [individualDni, setIndividualDni] = useState('');
  const [individualCuil, setIndividualCuil] = useState('');
  const [individualAddress, setIndividualAddress] = useState('');
  const [individualPhone, setIndividualPhone] = useState('');

  // Datos EMPRESA
  const [companyName, setCompanyName] = useState('');
  const [companyCuit, setCompanyCuit] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [representativeEmail, setRepresentativeEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      const supabase = createClient();

      // 1. Crear usuario en auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // 2. ESPERAR un momento para que Supabase propague el user
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Crear organización
      const orgData: any = {
        user_id: authData.user.id,
        email,
        account_type: accountType,
      };

      if (accountType === 'individual') {
        orgData.individual_name = individualName;
        orgData.individual_dni = individualDni;
        orgData.individual_cuil = individualCuil;
        orgData.individual_address = individualAddress;
        orgData.individual_phone = individualPhone;
      } else {
        orgData.company_name = companyName;
        orgData.company_cuit = companyCuit;
        orgData.company_industry = companyIndustry;
        orgData.company_address = companyAddress;
        orgData.company_phone = companyPhone;
        orgData.company_representative_name = representativeName;
        orgData.company_representative_phone = representativePhone;
        orgData.company_representative_email = representativeEmail;
      }

      const { error: orgError } = await supabase
        .from('organizations')
        .insert(orgData);

      if (orgError) {
        console.error('Error creating organization:', orgError);
        throw new Error(`Error al crear organización: ${orgError.message}`);
      }

      setMessage('✅ Registro exitoso. Tu cuenta será revisada por un administrador.');
      
      setTimeout(() => {
        router.push('/pending-approval');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Crear Cuenta</h1>
            <p className="text-gray-600">FDS - Firma Digital Simple</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setAccountType('individual')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                accountType === 'individual'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              👤 Particular
            </button>
            <button
              onClick={() => setAccountType('company')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                accountType === 'company'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              🏢 Empresa
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email y Password */}
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Contraseña *</label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label className="label">Confirmar Contraseña *</label>
              <input
                type="password"
                required
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
              />
            </div>

            {/* INDIVIDUAL */}
            {accountType === 'individual' && (
              <>
                <div>
                  <label className="label">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={individualName}
                    onChange={(e) => setIndividualName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">DNI *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={individualDni}
                      onChange={(e) => setIndividualDni(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">CUIL *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="20-12345678-9"
                      value={individualCuil}
                      onChange={(e) => setIndividualCuil(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Dirección *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={individualAddress}
                    onChange={(e) => setIndividualAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Celular *</label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    placeholder="+54 9 11 1234-5678"
                    value={individualPhone}
                    onChange={(e) => setIndividualPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* EMPRESA */}
            {accountType === 'company' && (
              <>
                <div>
                  <label className="label">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">CUIT *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="30-12345678-9"
                      value={companyCuit}
                      onChange={(e) => setCompanyCuit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Rubro *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      placeholder="Ej: Inmobiliaria, Servicios, etc"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Dirección *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    className="input-field"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-bold mb-4">Datos del Apoderado</h3>

                  <div>
                    <label className="label">Nombre del Apoderado *</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Celular del Apoderado *</label>
                      <input
                        type="tel"
                        required
                        className="input-field"
                        value={representativePhone}
                        onChange={(e) => setRepresentativePhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Email del Apoderado *</label>
                      <input
                        type="email"
                        required
                        className="input-field"
                        value={representativeEmail}
                        onChange={(e) => setRepresentativeEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Iniciar Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
