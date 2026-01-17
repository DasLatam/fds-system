'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [organization, setOrganization] = useState<any>(null);

  const [email, setEmail] = useState('');
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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!org) {
        router.push('/pending-approval');
        return;
      }

      setOrganization(org);
      setEmail(org.email || '');

      if (org.account_type === 'individual') {
        setIndividualName(org.individual_name || '');
        setIndividualDni(org.individual_dni || '');
        setIndividualCuil(org.individual_cuil || '');
        setIndividualAddress(org.individual_address || '');
        setIndividualPhone(org.individual_phone || '');
      } else {
        setCompanyName(org.company_name || '');
        setCompanyCuit(org.company_cuit || '');
        setCompanyIndustry(org.company_industry || '');
        setCompanyAddress(org.company_address || '');
        setCompanyPhone(org.company_phone || '');
        setRepresentativeName(org.company_representative_name || '');
        setRepresentativePhone(org.company_representative_phone || '');
        setRepresentativeEmail(org.company_representative_email || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const supabase = createClient();

      const updates: any = { email };

      if (organization.account_type === 'individual') {
        updates.individual_name = individualName;
        updates.individual_dni = individualDni;
        updates.individual_cuil = individualCuil;
        updates.individual_address = individualAddress;
        updates.individual_phone = individualPhone;
      } else {
        updates.company_name = companyName;
        updates.company_cuit = companyCuit;
        updates.company_industry = companyIndustry;
        updates.company_address = companyAddress;
        updates.company_phone = companyPhone;
        updates.company_representative_name = representativeName;
        updates.company_representative_phone = representativePhone;
        updates.company_representative_email = representativeEmail;
      }

      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id);

      if (error) throw error;

      setMessage('✅ Datos actualizados correctamente');
      setTimeout(() => router.push('/dashboard/user'), 2000);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="mb-6">
            <Link href="/dashboard/user" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
              ← Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">
              Actualiza tus datos personales
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {organization.account_type === 'individual' ? (
              <>
                <div>
                  <label className="label">Nombre Completo</label>
                  <input
                    type="text"
                    className="input-field"
                    value={individualName}
                    onChange={(e) => setIndividualName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">DNI</label>
                    <input
                      type="text"
                      className="input-field"
                      value={individualDni}
                      onChange={(e) => setIndividualDni(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">CUIL</label>
                    <input
                      type="text"
                      className="input-field"
                      value={individualCuil}
                      onChange={(e) => setIndividualCuil(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Dirección</label>
                  <input
                    type="text"
                    className="input-field"
                    value={individualAddress}
                    onChange={(e) => setIndividualAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Celular</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={individualPhone}
                    onChange={(e) => setIndividualPhone(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Nombre de la Empresa</label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">CUIT</label>
                    <input
                      type="text"
                      className="input-field"
                      value={companyCuit}
                      onChange={(e) => setCompanyCuit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Rubro</label>
                    <input
                      type="text"
                      className="input-field"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Dirección</label>
                  <input
                    type="text"
                    className="input-field"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                  />
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-bold mb-4">Datos del Apoderado</h3>

                  <div>
                    <label className="label">Nombre del Apoderado</label>
                    <input
                      type="text"
                      className="input-field"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label">Celular</label>
                      <input
                        type="tel"
                        className="input-field"
                        value={representativePhone}
                        onChange={(e) => setRepresentativePhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        className="input-field"
                        value={representativeEmail}
                        onChange={(e) => setRepresentativeEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4 mt-6">
              <Link href="/dashboard/user" className="btn-secondary flex-1 text-center">
                Cancelar
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
