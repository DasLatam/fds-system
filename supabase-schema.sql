-- =====================================================
-- FDS (Firma Digital Simple) - Database Schema
-- DasLATAM - 2026
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users
-- Almacena información de los usuarios del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('inmobiliaria', 'locador', 'locatario')),
    full_name TEXT NOT NULL,
    dni TEXT,
    address TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    two_factor_secret TEXT,
    accepted_terms_at TIMESTAMP WITH TIME ZONE,
    accepted_privacy_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =====================================================
-- TABLA: contracts
-- Almacena los contratos de alquiler
-- =====================================================
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_by UUID REFERENCES public.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'firmado_parcial', 'firmado_completo', 'rechazado', 'cancelado')),
    
    -- Datos del LOCADOR
    locador_nombre TEXT NOT NULL,
    locador_dni TEXT NOT NULL,
    locador_domicilio TEXT NOT NULL,
    locador_email TEXT NOT NULL,
    locador_user_id UUID REFERENCES public.users(id),
    locador_firma TEXT,
    locador_firmado_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos del LOCATARIO
    locatario_nombre TEXT NOT NULL,
    locatario_dni TEXT NOT NULL,
    locatario_domicilio TEXT NOT NULL,
    locatario_email TEXT NOT NULL,
    locatario_user_id UUID REFERENCES public.users(id),
    locatario_firma TEXT,
    locatario_firmado_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos del INMUEBLE
    inmueble_direccion TEXT NOT NULL,
    inmueble_barrio TEXT NOT NULL,
    inmueble_lote TEXT NOT NULL,
    inmueble_partido TEXT NOT NULL,
    inmueble_provincia TEXT NOT NULL,
    
    -- Datos del CONTRATO
    plazo_noches INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    fecha_fin DATE NOT NULL,
    hora_fin TIME NOT NULL,
    precio_total NUMERIC(12, 2) NOT NULL,
    precio_moneda TEXT NOT NULL DEFAULT 'USD' CHECK (precio_moneda IN ('USD', 'ARS')),
    max_personas INTEGER NOT NULL DEFAULT 8,
    deposito_garantia NUMERIC(12, 2) NOT NULL,
    
    -- URLs y tokens
    pdf_original_url TEXT,
    pdf_firmado_url TEXT,
    token_locador TEXT UNIQUE,
    token_locatario TEXT UNIQUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =====================================================
-- TABLA: signature_requests
-- Registra las solicitudes de firma y su estado
-- =====================================================
CREATE TABLE IF NOT EXISTS public.signature_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('locador', 'locatario')),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '30 days') NOT NULL,
    signed BOOLEAN DEFAULT FALSE NOT NULL,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_ip INET,
    signed_user_agent TEXT,
    rejected BOOLEAN DEFAULT FALSE NOT NULL,
    rejected_reason TEXT,
    rejected_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    consent_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =====================================================
-- TABLA: audit_logs
-- Registra todas las acciones importantes del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- =====================================================
-- ÍNDICES para mejor performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_locador_email ON public.contracts(locador_email);
CREATE INDEX IF NOT EXISTS idx_contracts_locatario_email ON public.contracts(locatario_email);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_contract_id ON public.signature_requests(contract_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_token ON public.signature_requests(token);
CREATE INDEX IF NOT EXISTS idx_signature_requests_expires_at ON public.signature_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- =====================================================
-- FUNCIONES para actualizar timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para la tabla users
CREATE POLICY "Los usuarios pueden ver su propio perfil"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Políticas para la tabla contracts
CREATE POLICY "Las inmobiliarias pueden ver todos los contratos que crearon"
    ON public.contracts FOR SELECT
    USING (
        created_by = auth.uid() OR
        locador_user_id = auth.uid() OR
        locatario_user_id = auth.uid()
    );

CREATE POLICY "Las inmobiliarias pueden crear contratos"
    ON public.contracts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'inmobiliaria'
        )
    );

CREATE POLICY "Las inmobiliarias pueden actualizar sus contratos"
    ON public.contracts FOR UPDATE
    USING (created_by = auth.uid());

-- Políticas para la tabla signature_requests
CREATE POLICY "Cualquiera puede ver signature_requests de sus contratos"
    ON public.signature_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE id = contract_id AND (
                created_by = auth.uid() OR
                locador_user_id = auth.uid() OR
                locatario_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Las inmobiliarias pueden crear signature_requests"
    ON public.signature_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contracts
            WHERE id = contract_id AND created_by = auth.uid()
        )
    );

-- Políticas para la tabla audit_logs
CREATE POLICY "Los usuarios pueden ver sus propios audit logs"
    ON public.audit_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "El sistema puede insertar audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- FUNCIÓN para limpiar tokens expirados automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.clean_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM public.signature_requests
    WHERE expires_at < TIMEZONE('utc', NOW())
    AND signed = FALSE
    AND rejected = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN para registrar acciones en audit_logs
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_audit(
    p_user_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_metadata JSONB
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        ip_address,
        user_agent,
        metadata
    ) VALUES (
        p_user_id,
        p_action,
        p_entity_type,
        p_entity_id,
        p_ip_address,
        p_user_agent,
        p_metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN para crear usuario automáticamente después de sign up
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        'inmobiliaria', -- Por defecto, todos los nuevos usuarios son inmobiliarias
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STORAGE BUCKET para PDFs y firmas
-- =====================================================

-- Crear bucket para contratos (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para contracts
CREATE POLICY "Cualquiera puede ver archivos del bucket contracts"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'contracts');

CREATE POLICY "Las inmobiliarias pueden subir archivos al bucket contracts"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'contracts' AND
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'inmobiliaria')
    );

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - Comentar si no se necesita)
-- =====================================================

-- Usuario de ejemplo para testing
-- Nota: Este usuario se crea solo si no existe
-- INSERT INTO auth.users (
--     instance_id,
--     id,
--     aud,
--     role,
--     email,
--     encrypted_password,
--     email_confirmed_at,
--     created_at,
--     updated_at,
--     raw_app_meta_data,
--     raw_user_meta_data,
--     is_super_admin,
--     confirmation_token
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000',
--     uuid_generate_v4(),
--     'authenticated',
--     'authenticated',
--     'test@inmobiliaria.com',
--     crypt('password123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW(),
--     '{"provider":"email","providers":["email"]}',
--     '{"full_name":"Inmobiliaria Test"}',
--     false,
--     ''
-- ) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

-- Verificación de las tablas creadas
SELECT 
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
