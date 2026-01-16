-- =====================================================
-- SISTEMA DE ROLES - FDS
-- Este script debe ejecutarse en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLA DE ROLES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('inmobiliaria', 'locador', 'locatario', 'admin')),
  company_name TEXT, -- Solo para inmobiliarias
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_approved ON public.user_roles(approved);

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver su propio rol
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política: Admins pueden ver todos los roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND approved = true
  )
);

-- Política: Inmobiliarias pueden ver locadores y locatarios
DROP POLICY IF EXISTS "Inmobiliarias can view clients" ON public.user_roles;
CREATE POLICY "Inmobiliarias can view clients"
ON public.user_roles
FOR SELECT
USING (
  role IN ('locador', 'locatario') AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'inmobiliaria' AND approved = true
  )
);

-- Política: Solo admins pueden actualizar roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles 
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND approved = true
  )
);

-- Política: Sistema puede insertar roles (para nuevos usuarios)
DROP POLICY IF EXISTS "System can insert roles" ON public.user_roles;
CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (true); -- Esto se controla desde el código

-- =====================================================
-- 3. FUNCIONES DE UTILIDAD
-- =====================================================

-- Función: Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = auth.uid() AND approved = true;
  
  RETURN user_role;
END;
$$;

-- Función: Verificar si usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND approved = true
  );
END;
$$;

-- Función: Verificar si usuario es inmobiliaria aprobada
CREATE OR REPLACE FUNCTION public.is_inmobiliaria()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'inmobiliaria' AND approved = true
  );
END;
$$;

-- Función: Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Aplicar trigger a user_roles
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. CREAR PRIMER ADMIN
-- =====================================================
-- IMPORTANTE: Reemplaza 'TU_EMAIL_ADMIN' con tu email real

-- Primero, loguéate en la app con tu email para crear el usuario en auth.users
-- Luego ejecuta esto (reemplaza el email):

-- INSERT INTO public.user_roles (user_id, email, role, approved, approved_at)
-- SELECT 
--   id,
--   email,
--   'admin',
--   true,
--   NOW()
-- FROM auth.users
-- WHERE email = 'firmadigitalsimple@daslatam.org';

-- =====================================================
-- 5. MODIFICAR TABLA CONTRACTS
-- =====================================================
-- Agregar campos nuevos a la tabla contracts

ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS inmueble_barrio TEXT,
ADD COLUMN IF NOT EXISTS inmueble_lote TEXT,
ADD COLUMN IF NOT EXISTS personas_max INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS acepta_mascotas BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS incluye_blanqueria BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS incluye_limpieza BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS electricidad_kwts INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS directv_tvs TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS deposito_garantia DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS clausula_penal_diaria DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS moneda TEXT DEFAULT 'USD' CHECK (moneda IN ('USD', 'ARS'));

-- Actualizar contratos existentes con valores por defecto
UPDATE public.contracts
SET 
  inmueble_barrio = 'Deportiva',
  inmueble_lote = '278',
  personas_max = 6,
  acepta_mascotas = false,
  incluye_blanqueria = false,
  incluye_limpieza = false,
  electricidad_kwts = 100,
  directv_tvs = '1',
  deposito_garantia = precio_total * 0.2,
  clausula_penal_diaria = 500,
  moneda = 'USD'
WHERE inmueble_barrio IS NULL;

-- =====================================================
-- 6. TABLA DE NOTIFICACIONES PARA ADMINS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('new_inmobiliaria', 'contract_signed', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- RLS para notificaciones
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (public.is_admin());

-- =====================================================
-- 7. FUNCIÓN: Crear notificación para nueva inmobiliaria
-- =====================================================
CREATE OR REPLACE FUNCTION public.notify_new_inmobiliaria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo notificar si es inmobiliaria y no está aprobada
  IF NEW.role = 'inmobiliaria' AND NEW.approved = false THEN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
      'new_inmobiliaria',
      'Nueva Inmobiliaria Pendiente',
      'Una nueva inmobiliaria se ha registrado y está esperando aprobación: ' || COALESCE(NEW.company_name, NEW.email),
      jsonb_build_object(
        'user_id', NEW.user_id,
        'email', NEW.email,
        'company_name', NEW.company_name,
        'created_at', NEW.created_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS notify_admin_new_inmobiliaria ON public.user_roles;
CREATE TRIGGER notify_admin_new_inmobiliaria
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_inmobiliaria();

-- =====================================================
-- 8. VISTA: Inmobiliarias pendientes de aprobación
-- =====================================================
CREATE OR REPLACE VIEW public.pending_inmobiliarias AS
SELECT 
  ur.id,
  ur.user_id,
  ur.email,
  ur.company_name,
  ur.created_at,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'inmobiliaria' 
  AND ur.approved = false 
  AND ur.rejection_reason IS NULL
ORDER BY ur.created_at ASC;

-- =====================================================
-- 9. DATOS DE EJEMPLO (OPCIONAL - SOLO PARA TESTING)
-- =====================================================
-- Puedes descomentar esto si quieres datos de prueba

-- INSERT INTO public.user_roles (user_id, email, role, company_name, approved)
-- SELECT 
--   gen_random_uuid(),
--   'test-inmobiliaria@example.com',
--   'inmobiliaria',
--   'Inmobiliaria Test SA',
--   false;

-- =====================================================
-- 10. VERIFICACIÓN
-- =====================================================
-- Ejecuta estas queries para verificar que todo está OK:

-- Ver estructura de user_roles
-- SELECT * FROM information_schema.columns WHERE table_name = 'user_roles';

-- Ver políticas RLS
-- SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- Verificar funciones
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';

-- =====================================================
-- ✅ SCRIPT COMPLETADO
-- =====================================================
-- Ahora ejecuta este script completo en Supabase SQL Editor
-- Después, loguéate con tu email y ejecuta el INSERT de admin
