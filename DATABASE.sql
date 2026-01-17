-- =====================================================
-- FDS v2.0 - Sistema Universal de Firma Digital
-- EJECUTAR ESTE SQL COMPLETO EN SUPABASE
-- =====================================================

-- 1. LIMPIAR (eliminar tablas viejas)
DROP TABLE IF EXISTS signers CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS signature_requests CASCADE;

-- 2. TABLA DE ORGANIZACIONES (usuarios del sistema)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  
  -- Tipo de cuenta
  account_type TEXT NOT NULL CHECK (account_type IN ('individual', 'company')),
  
  -- Datos INDIVIDUAL
  individual_name TEXT,
  individual_dni TEXT,
  individual_cuil TEXT,
  individual_address TEXT,
  individual_phone TEXT,
  
  -- Datos EMPRESA
  company_name TEXT,
  company_cuit TEXT,
  company_industry TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_representative_name TEXT,
  company_representative_phone TEXT,
  company_representative_email TEXT,
  
  -- Aprobación y permisos
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Features
  can_use_templates BOOLEAN DEFAULT false,
  available_templates TEXT[] DEFAULT '{}',
  max_documents_per_month INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_user_id ON organizations(user_id);
CREATE INDEX idx_organizations_email ON organizations(email);
CREATE INDEX idx_organizations_approved ON organizations(approved);
CREATE INDEX idx_organizations_account_type ON organizations(account_type);

-- 3. TABLA DE DOCUMENTOS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Información del documento
  title TEXT NOT NULL,
  description TEXT,
  
  -- Archivo
  pdf_url TEXT,
  pdf_storage_path TEXT,
  original_filename TEXT,
  file_size_bytes BIGINT,
  
  -- Tipo
  document_type TEXT NOT NULL CHECK (document_type IN ('uploaded_pdf', 'template_inmobiliaria')),
  
  -- Template data (JSONB para flexibilidad)
  template_data JSONB,
  
  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'cancelled', 'expired')),
  
  -- Fechas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- 4. TABLA DE FIRMANTES
CREATE TABLE signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Información del firmante
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  
  -- Orden de firma
  signing_order INTEGER DEFAULT 0,
  
  -- Token de firma
  signature_token TEXT UNIQUE NOT NULL,
  
  -- Firma
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_ip TEXT,
  signature_user_agent TEXT,
  signature_geolocation JSONB,
  signature_metadata JSONB,
  
  -- Notificaciones
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signers_document_id ON signers(document_id);
CREATE INDEX idx_signers_email ON signers(email);
CREATE INDEX idx_signers_token ON signers(signature_token);
CREATE INDEX idx_signers_signed_at ON signers(signed_at);

-- 5. STORAGE BUCKET PARA PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "Users can upload their documents" ON storage.objects;
CREATE POLICY "Users can upload their documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Users can view their documents" ON storage.objects;
CREATE POLICY "Users can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;
CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid() IN (
    SELECT user_id FROM organizations WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 6. FUNCIÓN PARA ACTUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_signers_updated_at ON signers;
CREATE TRIGGER update_signers_updated_at
  BEFORE UPDATE ON signers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNCIÓN PARA ACTUALIZAR STATUS DEL DOCUMENTO
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
DECLARE
  total_signers INTEGER;
  signed_count INTEGER;
  doc_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    doc_id := NEW.document_id;
  ELSE
    doc_id := OLD.document_id;
  END IF;

  SELECT COUNT(*), COUNT(signed_at)
  INTO total_signers, signed_count
  FROM signers
  WHERE document_id = doc_id;

  IF signed_count = 0 THEN
    UPDATE documents SET status = 'pending' WHERE id = doc_id;
  ELSIF signed_count < total_signers THEN
    UPDATE documents SET status = 'partial' WHERE id = doc_id;
  ELSE
    UPDATE documents SET status = 'completed', completed_at = NOW() WHERE id = doc_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_document_status ON signers;
CREATE TRIGGER trigger_update_document_status
  AFTER INSERT OR UPDATE OR DELETE ON signers
  FOR EACH ROW
  EXECUTE FUNCTION update_document_status();

-- 8. DESACTIVAR RLS
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE signers DISABLE ROW LEVEL SECURITY;

-- 9. CREAR USUARIO ADMIN
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'firmadigitalsimple@daslatam.org'
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO organizations (
      user_id,
      email,
      account_type,
      individual_name,
      role,
      approved,
      approved_at,
      can_use_templates,
      available_templates,
      max_documents_per_month
    ) VALUES (
      admin_user_id,
      'firmadigitalsimple@daslatam.org',
      'individual',
      'DasLATAM Admin',
      'admin',
      true,
      NOW(),
      true,
      ARRAY['inmobiliaria'],
      999999
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      role = 'admin',
      approved = true;
      
    RAISE NOTICE 'Admin user configured';
  END IF;
END $$;

-- 10. VERIFICACIÓN
SELECT 'Setup completo!' as message;
SELECT COUNT(*) as admin_count FROM organizations WHERE role = 'admin';
