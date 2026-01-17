'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [message, setMessage] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [individualName, setIndividualName] = useState('');
  const [individualDni, setIndividualDni] = useState('');
  const [individualCuil, setIndividualCuil] = useState('');
  const [individualAddress, setIndividualAddress] = useState('');
  const [individualPhone, setIndividualPhone] = useState('');

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

      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { account_type: accountType },
          emailRedirectTo: undefined
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (!org) {
        await supabase
          .from('organizations')
          .insert({
            user_id: authData.user.id,
            email,
            account_type: accountType,
            approved_status: 'pending'
          });
      }

      const updateData: any = { email };

      if (accountType === 'individual') {
        updateData.individual_name = individualName;
        updateData.individual_dni = individualDni;
        updateData.individual_cuil = individualCuil;
        updateData.individual_address = individualAddress;
        updateData.individual_phone = individualPhone;
      } else {
        updateData.company_name = companyName;
        updateData.company_cuit = companyCuit;
        updateData.company_industry = companyIndustry;
        updateData.company_address = companyAddress;
        updateData.company_phone = companyPhone;
        updateData.company_representative_name = representativeName;
        updateData.company_representative_phone = representativePhone;
        updateData.company_representative_email = representativeEmail;
      }

      await supabase
        .from('organizations')
        .update(updateData)
        .eq('user_id', authData.user.id);

      // Éxito - redirigir sin importar si el email falló
      router.push('/pending-approval');
    } catch (error: any) {
      console.error('Registration error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-3xl">✍️</div>
            <h1 className="text-2xl font-bold text-indigo-600">FDS</h1>
          </Link>
        </div>
      </header>

      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-3xl font-bold mb-2">Crear Cuenta</h2>
            <p className="text-gray-600 mb-6">Registrate para comenzar a usar FDS</p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setAccountType('individual')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  accountType === 'individual'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                👤 Particular
              </button>
              <button
                onClick={() => setAccountType('company')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  accountType === 'company'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                🏢 Empresa
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  minLength={6}
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Confirmar Contraseña *</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {accountType === 'individual' ? (
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
                      value={individualPhone}
                      onChange={(e) => setIndividualPhone(e.target.value)}
                    />
                  </div>
                </>
              ) : (
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

                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-4">Datos del Apoderado</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="label">Nombre *</label>
                        <input
                          type="text"
                          required
                          className="input-field"
                          value={representativeName}
                          onChange={(e) => setRepresentativeName(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="label">Celular *</label>
                          <input
                            type="tel"
                            required
                            className="input-field"
                            value={representativePhone}
                            onChange={(e) => setRepresentativePhone(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="label">Email *</label>
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
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </button>

              {message && (
                <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm">
                  {message}
                </div>
              )}

              <p className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth" className="text-indigo-600 hover:underline font-medium">
                  Iniciar Sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
