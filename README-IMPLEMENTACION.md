# 🚀 GUÍA DE IMPLEMENTACIÓN - FDS SISTEMA COMPLETO

## 📋 ÍNDICE

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Base de Datos](#1-configuración-de-base-de-datos)
3. [Variables de Entorno](#2-variables-de-entorno)
4. [Configuración de Email](#3-configuración-de-email)
5. [Deploy](#4-deploy)
6. [Crear Usuario Admin](#5-crear-usuario-admin)
7. [Testing del Sistema](#6-testing-del-sistema)
8. [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

✅ Cuenta de Supabase (gratis)  
✅ Cuenta de Vercel (gratis)  
✅ Cuenta de email (Ferozo, Gmail, etc.)  
✅ Node.js 18+ instalado  
✅ Git configurado  

---

## 1. Configuración de Base de Datos

### Paso 1.1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea nuevo proyecto
3. Guarda la URL y las API keys

### Paso 1.2: Ejecutar SQL

1. En Supabase Dashboard → **SQL Editor**
2. Copia **TODO** el contenido de `supabase-setup.sql`
3. Pégalo y click en **"RUN"**
4. Verifica que no haya errores (debe decir "Success")

**Qué hace este SQL:**
- ✅ Crea tabla `user_roles` (gestión de usuarios)
- ✅ Crea tabla `admin_notifications` (notificaciones)
- ✅ Agrega 12 campos nuevos a `contracts`
- ✅ Configura RLS (Row Level Security)
- ✅ Crea funciones de utilidad
- ✅ Configura triggers automáticos

---

## 2. Variables de Entorno

### Paso 2.1: Desarrollo Local

Crea `.env.local` en la raíz del proyecto:

```bash
# Copia desde .env.example
cp .env.example .env.local
```

Completa con tus valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

SMTP_HOST=mail.daslatam.org
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=firmadigitalsimple@daslatam.org
SMTP_PASS=tu_contraseña_real

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Paso 2.2: Producción (Vercel)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable (copia de .env.example)
4. ⚠️ Cambia `NEXT_PUBLIC_SITE_URL` a tu dominio de producción

---

## 3. Configuración de Email

### Opción A: SMTP (Ferozo, Gmail, etc.)

**Para Ferozo:**

```bash
SMTP_HOST=mail.daslatam.org
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=firmadigitalsimple@daslatam.org
SMTP_PASS=tu_contraseña_ferozo
```

**Para Gmail:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tucuenta@gmail.com
SMTP_PASS=tu_app_password  # NO tu contraseña normal!
```

Para Gmail, debes generar una "App Password":
1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Genera nueva contraseña de aplicación
3. Úsala en `SMTP_PASS`

### Opción B: Template de Email en Supabase

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Click en **"Magic Link"**
3. Copia el HTML de `GUIA-IMPLEMENTACION-COMPLETA.md` sección email template
4. Pega en el campo "Body"
5. **Subject:** `Tu enlace de acceso - FDS | Firma Digital Simple`
6. **Sender Name:** `FDS - Firma Digital Simple`
7. Save

---

## 4. Deploy

### Opción A: Deploy automático con Vercel

```bash
# En la carpeta del proyecto
npm install
vercel
```

Sigue las instrucciones del CLI.

### Opción B: Deploy desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. "New Project" → Import desde GitHub
4. Configura variables de entorno
5. Deploy

---

## 5. Crear Usuario Admin

⚠️ **IMPORTANTE:** Primero debes registrarte en la app como inmobiliaria para que se cree tu usuario.

### Paso 5.1: Registrarte

1. Ve a `/registro` en tu app
2. Completa formulario como inmobiliaria
3. Confirma tu email
4. Espera en "Pending Approval"

### Paso 5.2: Convertirte en Admin

1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta este SQL (⚠️ cambia el email por el tuyo):

```sql
INSERT INTO public.user_roles (user_id, email, role, approved, approved_at)
SELECT 
  id,
  email,
  'admin',
  true,
  NOW()
FROM auth.users
WHERE email = 'TU_EMAIL@daslatam.org';
```

3. Refresca la página en tu navegador
4. Deberías ver el Dashboard de Admin

---

## 6. Testing del Sistema

### Test 1: Flujo de Registro de Inmobiliaria ✅

1. Ve a `/registro`
2. Selecciona "Inmobiliaria"
3. Completa datos
4. Verifica email de confirmación
5. Click en link del email
6. Deberías ver "Pending Approval"

### Test 2: Aprobación de Admin ✅

1. Login como admin
2. Ve a `/dashboard/admin`
3. Deberías ver inmobiliaria pendiente
4. Click "Aprobar"
5. La inmobiliaria ahora puede ingresar

### Test 3: Crear Contrato ✅

1. Login como inmobiliaria aprobada
2. Click "Nuevo Contrato"
3. Completa TODOS los campos:
   - Locador (nombre, email, DNI, teléfono, domicilio)
   - Locatario (nombre, email, DNI, teléfono, domicilio)
   - Inmueble (dirección completa, barrio, lote)
   - Fechas (inicio y fin - calcula noches automáticamente)
   - Detalles (personas, mascotas, blanquería, limpieza)
   - Servicios (electricidad, DirectTV)
   - Precios (total, depósito, cláusula penal)
4. Submit
5. Verifica en Vercel logs que se ejecutó

### Test 4: Verificar Emails ✅

1. Revisa bandeja de entrada del locador
2. Revisa bandeja de entrada del locatario
3. Ambos deberían recibir email con link de firma

**Si no llegan emails:**
- Revisa Vercel logs (`vercel logs`)
- Verifica variables SMTP en Vercel
- Prueba enviar email manual desde webmail
- Revisa spam/junk folder

### Test 5: Firmar Contrato ✅

1. Abre link del email (locador o locatario)
2. Verifica que muestre detalles del contrato
3. Click "Firmar Digitalmente"
4. Confirma
5. Debería mostrar "Firmado exitosamente"

### Test 6: Verificar Contrato Completado ✅

1. Login como inmobiliaria
2. Ve al contrato
3. Si ambos firmaron:
   - Status debe ser "Completado"
   - Debe aparecer botón "Descargar PDF"

---

## Troubleshooting

### ❌ Error: "No role found"

**Causa:** Usuario no tiene registro en `user_roles`

**Solución:**
```sql
-- Ver usuarios sin rol
SELECT u.email, u.id
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL;

-- Crear rol manualmente
INSERT INTO user_roles (user_id, email, role, approved)
VALUES ('user-id-aqui', 'email@example.com', 'inmobiliaria', false);
```

---

### ❌ Error: "SMTP connection failed"

**Causa:** Credenciales SMTP incorrectas o puerto bloqueado

**Solución:**

1. **Verificar credenciales:**
   ```bash
   # En Vercel logs
   vercel logs --follow
   ```
   Busca línea con "SMTP Configuration"

2. **Probar SMTP manualmente:**
   ```javascript
   // test-smtp.js
   const nodemailer = require('nodemailer');
   
   const transporter = nodemailer.createTransport({
     host: 'mail.daslatam.org',
     port: 465,
     secure: true,
     auth: {
       user: 'firmadigitalsimple@daslatam.org',
       pass: 'TU_CONTRASEÑA'
     }
   });
   
   transporter.verify().then(console.log).catch(console.error);
   ```

3. **Alternativa:** Usar Resend
   ```bash
   npm install resend
   ```
   Y configurar `RESEND_API_KEY` en Vercel

---

### ❌ Error: SQL "relation does not exist"

**Causa:** No ejecutaste el `supabase-setup.sql`

**Solución:**
1. Ve a Supabase SQL Editor
2. Ejecuta TODO el archivo `supabase-setup.sql`

---

### ❌ Página en blanco o 404

**Causa:** Archivos no subidos correctamente

**Solución:**
```bash
# Verificar que todos los archivos estén
ls -la app/
ls -la middleware.ts

# Re-deploy
vercel --prod
```

---

### ❌ "Pending approval" infinito

**Causa:** No te convertiste en admin

**Solución:**
```sql
-- Verificar tu rol
SELECT * FROM user_roles WHERE email = 'TU_EMAIL';

-- Si no eres admin, ejecuta:
UPDATE user_roles 
SET role = 'admin', approved = true, approved_at = NOW()
WHERE email = 'TU_EMAIL';
```

---

## 🎯 Checklist Final

Antes de considerar el sistema completo, verifica:

```
□ SQL ejecutado sin errores
□ Variables de entorno configuradas (local y Vercel)
□ Email template configurado en Supabase
□ Usuario admin creado
□ Registro de inmobiliaria funciona
□ Aprobación de admin funciona
□ Creación de contrato funciona
□ Emails llegan correctamente
□ Firma digital funciona
□ PDF se genera (o marca como completado)
□ Todos los roles tienen dashboards
□ No hay errores en consola de Vercel
```

---

## 📚 Recursos Adicionales

- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Vercel](https://vercel.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Ley 25.506 - Firma Digital](http://servicios.infoleg.gob.ar/infolegInternet/anexos/70000-74999/70749/norma.htm)

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de Vercel (`vercel logs`)
2. Revisa la consola del navegador (F12)
3. Verifica que todas las variables estén configuradas
4. Consulta este README completo

**Email de soporte:**  
firmadigitalsimple@daslatam.org

---

✅ **SISTEMA LISTO PARA PRODUCCIÓN**
