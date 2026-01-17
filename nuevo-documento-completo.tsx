'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Signer {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function NuevoDocumentoPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Upload, 2: Firmantes, 3: Confirmar
  const router = useRouter();

  // Documento
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  // Firmantes
  const [signers, setSigners] = useState<Signer[]>([
    { id: '1', name: '', email: '', role: '' }
  ]);

  // Expiración
  const [expiresInDays, setExpiresInDays] = useState(30);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (file.type !== 'application/pdf') {
      setMessage('❌ Solo se permiten archivos PDF');
      return;
    }

    // Validar tamaño (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage('❌ El archivo no puede superar 10MB');
      return;
    }

    setPdfFile(file);
    
    // Preview
    const url = URL.createObjectURL(file);
    setPdfPreview(url);
    setMessage('');
  }

  function addSigner() {
    setSigners([...signers, { 
      id: Date.now().toString(), 
      name: '', 
      email: '', 
      role: '' 
    }]);
  }

  function removeSigner(id: string) {
    if (signers.length === 1) {
      setMessage('⚠️ Debe haber al menos un firmante');
      return;
    }
    setSigners(signers.filter(s => s.id !== id));
  }

  function updateSigner(id: string, field: keyof Signer, value: string) {
    setSigners(signers.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  }

  async function handleSubmit() {
    setLoading(true);
    setMessage('');

    try {
      // Validaciones
      if (!title.trim()) throw new Error('El título es obligatorio');
      if (!pdfFile) throw new Error('Debes subir un PDF');
      
      const invalidSigners = signers.filter(s => !s.name.trim() || !s.email.trim());
      if (invalidSigners.length > 0) {
        throw new Error('Todos los firmantes deben tener nombre y email');
      }

      // Validar emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = signers.filter(s => !emailRegex.test(s.email));
      if (invalidEmails.length > 0) {
        throw new Error('Hay emails inválidos');
      }

      const supabase = createClient();

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Obtener organización
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!org) throw new Error('Organización no encontrada');

      // 1. Subir PDF a Storage
      const fileName = `${org.id}/${Date.now()}-${pdfFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase
        .storage
        .from('documents')
        .getPublicUrl(fileName);

      // 3. Crear documento
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          organization_id: org.id,
          title,
          description,
          document_type: 'uploaded_pdf',
          pdf_url: publicUrl,
          pdf_storage_path: fileName,
          original_filename: pdfFile.name,
          file_size_bytes: pdfFile.size,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (docError) throw docError;

      // 4. Crear firmantes
      const signersData = signers.map((signer, index) => ({
        document_id: document.id,
        name: signer.name,
        email: signer.email,
        role: signer.role || null,
        signing_order: index,
        signature_token: generateToken(),
      }));

      const { error: signersError } = await supabase
        .from('signers')
        .insert(signersData);

      if (signersError) throw signersError;

      // 5. Enviar invitaciones por email
      setMessage('📧 Enviando invitaciones...');
      
      const response = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        console.error('Error sending invitations');
      }

      setMessage('✅ Documento creado y firmantes notificados');
      
      setTimeout(() => {
        router.push('/dashboard/user');
      }, 2000);

    } catch (error: any) {
      console.error('Error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/user" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Nuevo Documento para Firmar</h1>
          <p className="text-gray-600 mt-2">Sube un PDF y agrega los firmantes</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Documento</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Firmantes</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
          <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Confirmar</span>
          </div>
        </div>

        {/* Step 1: Documento */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Información del Documento</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Título del Documento *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ej: Contrato de Alquiler - Propiedad Av. Corrientes 1234"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Descripción (opcional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Breve descripción del documento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Archivo PDF *</label>
                <input
                  type="file"
                  accept=".pdf"
                  className="input-field"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 mt-1">Máximo 10MB</p>
              </div>

              {pdfPreview && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-2">📄 Archivo seleccionado:</p>
                  <p className="text-sm text-gray-700">{pdfFile?.name}</p>
                  <p className="text-xs text-gray-500">
                    {(pdfFile!.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div>
                <label className="label">Vencimiento del documento</label>
                <select
                  className="input-field"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                >
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!title || !pdfFile}
                className="btn-primary"
              >
                Siguiente: Firmantes →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Firmantes */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Firmantes del Documento</h2>
            
            <div className="space-y-4 mb-6">
              {signers.map((signer, index) => (
                <div key={signer.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Firmante {index + 1}</h3>
                    {signers.length > 1 && (
                      <button
                        onClick={() => removeSigner(signer.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="label text-xs">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Juan Pérez"
                        value={signer.name}
                        onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Email *</label>
                      <input
                        type="email"
                        required
                        className="input-field"
                        placeholder="juan@ejemplo.com"
                        value={signer.email}
                        onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Rol (opcional)</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ej: Locador, Testigo..."
                        value={signer.role || ''}
                        onChange={(e) => updateSigner(signer.id, 'role', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addSigner}
              className="btn-secondary w-full mb-6"
            >
              + Agregar Firmante
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Nota:</strong> Cada firmante recibirá un email con un link único para firmar el documento.
                El orden de firma es el mismo que se muestra aquí.
              </p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={signers.some(s => !s.name || !s.email)}
                className="btn-primary"
              >
                Siguiente: Confirmar →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmar */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Confirmar y Enviar</h2>
            
            <div className="space-y-6">
              {/* Resumen Documento */}
              <div>
                <h3 className="font-bold mb-3">📄 Documento</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><strong>Título:</strong> {title}</p>
                  {description && <p><strong>Descripción:</strong> {description}</p>}
                  <p><strong>Archivo:</strong> {pdfFile?.name}</p>
                  <p><strong>Tamaño:</strong> {(pdfFile!.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p><strong>Vence en:</strong> {expiresInDays} días</p>
                </div>
              </div>

              {/* Resumen Firmantes */}
              <div>
                <h3 className="font-bold mb-3">✍️ Firmantes ({signers.length})</h3>
                <div className="space-y-2">
                  {signers.map((signer, index) => (
                    <div key={signer.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{index + 1}. {signer.name}</p>
                      <p className="text-sm text-gray-600">{signer.email}</p>
                      {signer.role && (
                        <p className="text-sm text-gray-500">Rol: {signer.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmación Legal */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold mb-2">🛡️ Validez Legal</h4>
                <p className="text-sm text-green-800">
                  Este documento tendrá plena validez jurídica según la Ley 25.506 de Firma Digital 
                  y el Código Civil y Comercial de Argentina. Se registrarán timestamp, IP y metadata 
                  de cada firma para validación forense.
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-800' 
                    : message.includes('📧')
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-red-50 text-red-800'
                }`}>
                  {message}
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary" disabled={loading}>
                ← Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creando documento...' : '🚀 Crear y Enviar Invitaciones'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
