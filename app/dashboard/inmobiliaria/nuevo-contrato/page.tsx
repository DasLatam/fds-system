import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import NuevoContratoForm from '@/components/NuevoContratoForm';

export default async function NuevoContratoPage() {
  const supabase = createClient();
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth');
  }
  
  // Verificar rol
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.role !== 'inmobiliaria') {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="DasLATAM" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">FDS - Panel Inmobiliaria</h1>
              <p className="text-sm text-gray-600">{profile.full_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NuevoContratoForm />
      </main>
    </div>
  );
}
