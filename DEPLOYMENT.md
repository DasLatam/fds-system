# 🚀 GUÍA DE DEPLOYMENT PASO A PASO

Esta guía te llevará de CERO a tener el sistema FDS funcionando en producción.

## FASE 1: PREPARACIÓN (15 minutos)

### ✅ Lo que necesitas tener listo ANTES de empezar:

1. ☐ Cuenta en GitHub (gratuita)
2. ☐ Cuenta en Supabase (gratuita) 
3. ☐ Cuenta en Vercel (gratuita)
4. ☐ Cuenta en Upstash Redis (gratuita) - NUEVO
5. ☐ Credenciales SMTP de Ferozo
6. ☐ Logo de DasLATAM (ya incluido en /public)
7. ☐ Template del contrato PDF (ya incluido en /public)

---

## FASE 2: CONFIGURAR SUPABASE (10 minutos)

### Paso 1: Crear Proyecto

1. Ir a [https://supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Click en "New project"
4. Completar:
   - **Name**: `fds-production` (o el nombre que quieras)
   - **Database Password**: Generar una contraseña fuerte y **GUARDARLA**
   - **Region**: Elegir el más cercano (ej: South America - São Paulo)
5. Click en "Create new project"
6. **ESPERAR 2-3 minutos** mientras Supabase crea tu base de datos

### Paso 2: Ejecutar el SQL

1. En el menú izquierdo, click en **"SQL Editor"**
2. Click en "+ New query"
3. **Copiar TODO el contenido** del archivo `supabase-schema.sql`
4. **Pegarlo** en el editor
5. Click en "**RUN**" (abajo a la derecha)
6. Deberías ver: "Success. No rows returned" ✅

### Paso 3: Verificar Storage

1. En el menú izquierdo, click en **"Storage"**
2. Deberías ver un bucket llamado "**contracts**"
3. Click en el bucket "contracts"
4. Click en "**Policies**" (arriba)
5. Verificar que haya políticas de lectura/escritura

### Paso 4: Obtener las Credenciales

1. En el menú izquierdo, click en **"Settings"** (icono de engranaje)
2. Click en **"API"**
3. **COPIAR Y GUARDAR** estos valores:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Paso 5: Configurar Authentication

1. En el menú izquierdo, click en **"Authentication"**
2. Click en **"URL Configuration"**
3. En **"Site URL"** poner: `http://localhost:3000` (por ahora)
4. En **"Redirect URLs"** agregar: `http://localhost:3000/auth/callback`
5. Click en "Save"

---

## FASE 3: CONFIGURAR UPSTASH REDIS (5 minutos)

### Paso 1: Crear Base de Datos Redis

1. Ir a [https://upstash.com](https://upstash.com)
2. Click en "Sign Up" (puedes usar GitHub)
3. Una vez dentro, click en "Create Database"
4. Configurar:
   - **Name**: `fds-ratelimit`
   - **Type**: Regional (más barato)
   - **Region**: Elegir el más cercano (ej: US-EAST-1)
   - **Primary Region Only**: Sí (plan gratuito)
5. Click en "Create"

### Paso 2: Obtener Credenciales

1. Click en tu base de datos creada
2. En la pestaña "Details", encontrarás:
   - **UPSTASH_REDIS_REST_URL**: Algo como `https://xxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: Token largo
3. **COPIAR Y GUARDAR** ambos valores

**¿Para qué sirve?**  
Upstash Redis se usa para rate limiting (anti-spam). Protege tu sistema de:
- Múltiples intentos de firma
- Spam en creación de contratos
- Ataques DDoS

---

## FASE 4: SUBIR A GITHUB (5 minutos)

### Opción A: Desde la Terminal (Recomendado)

```bash
# 1. Ir a la carpeta del proyecto
cd fds-system

# 2. Inicializar Git
git init

# 3. Agregar todos los archivos
git add .

# 4. Hacer el primer commit
git commit -m "Initial commit - FDS System"

# 5. Crear repositorio en GitHub
# Ir a https://github.com/new
# Nombre: fds-system
# Privado o Público: TU ELECCIÓN
# NO inicializar con README (ya tenemos)

# 6. Conectar con GitHub (reemplazar con tu URL)
git remote add origin https://github.com/TU-USUARIO/fds-system.git

# 7. Subir
git branch -M main
git push -u origin main
```

### Opción B: GitHub Desktop (Más Visual)

1. Descargar e instalar [GitHub Desktop](https://desktop.github.com/)
2. Abrir GitHub Desktop
3. Click en "Add" > "Add Existing Repository"
4. Seleccionar la carpeta `fds-system`
5. Click en "Publish repository"
6. Elegir nombre y visibilidad
7. Click en "Publish"

---

## FASE 5: DEPLOY EN VERCEL (10 minutos)

### Paso 1: Conectar GitHub

1. Ir a [https://vercel.com](https://vercel.com)
2. Click en "Sign Up" y elegir "Continue with GitHub"
3. Autorizar Vercel en GitHub
4. Click en "Add New..." > "Project"
5. Buscar tu repositorio `fds-system`
6. Click en "Import"

### Paso 2: Configurar el Proyecto

**NO HACER DEPLOY TODAVÍA** - Primero configurar las variables:

1. En "Configure Project", expandir **"Environment Variables"**
2. Agregar UNA POR UNA estas variables (click en "Add" después de cada una):

```env
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1...
SMTP_HOST = va000847.ferozo.com
SMTP_PORT = 465
SMTP_SECURE = true
SMTP_USER = firmadigitalsimple@daslatam.org
SMTP_PASS = TU_PASSWORD_SMTP
UPSTASH_REDIS_REST_URL = https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN = TU_TOKEN_UPSTASH
NEXT_PUBLIC_APP_URL = https://fds-system.vercel.app
TOKEN_EXPIRATION_DAYS = 30
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 60
```

**IMPORTANTE**: 
- Reemplazar los valores de Supabase con los que copiaste en FASE 2
- Reemplazar `SMTP_PASS` con tu contraseña real
- `NEXT_PUBLIC_APP_URL` lo completarás después del deploy

### Paso 3: Deploy Inicial

1. Click en "**Deploy**"
2. **ESPERAR 2-3 minutos** mientras Vercel construye el proyecto
3. Cuando veas "🎉 Congratulations!" el deploy fue exitoso
4. Click en "Continue to Dashboard"
5. **COPIAR la URL** que te dio Vercel (ej: `https://fds-system.vercel.app`)

### Paso 4: Actualizar URLs

**A. En Vercel:**

1. En el dashboard de tu proyecto, click en "Settings"
2. Click en "Environment Variables"
3. Buscar `NEXT_PUBLIC_APP_URL`
4. Click en los 3 puntos > "Edit"
5. Reemplazar con tu URL real: `https://tu-proyecto.vercel.app`
6. Click en "Save"
7. Ir a "Deployments" > Click en los 3 puntos del último deploy > "Redeploy"

**B. En Supabase:**

1. Volver a Supabase
2. Ir a **Authentication** > **URL Configuration**
3. **Site URL**: cambiar a `https://tu-proyecto.vercel.app`
4. **Redirect URLs**: agregar `https://tu-proyecto.vercel.app/auth/callback`
5. Click en "Save"

---

## FASE 6: PRUEBA FINAL (5 minutos)

### ✅ Checklist de Pruebas:

1. ☐ **Abrir tu URL**: `https://tu-proyecto.vercel.app`
   - ¿Carga la landing page? ✅
   
2. ☐ **Probar autenticación**:
   - Click en "Ingresar"
   - Ingresar tu email
   - ¿Llegó el email con el magic link? ✅
   - Click en el link
   - ¿Te redirigió al dashboard? ✅

3. ☐ **Crear un contrato de prueba**:
   - Click en "Nuevo Contrato"
   - Completar todos los campos
   - Click en "Crear Contrato y Enviar para Firmar"
   - ¿Se creó exitosamente? ✅
   - ¿Llegaron los emails al locador y locatario? ✅

4. ☐ **Probar firma**:
   - Abrir el link de firma que llegó al email
   - ¿Carga la página de firma? ✅
   - Firmar en el canvas
   - Click en "Confirmar y Firmar"
   - ¿Se guardó la firma? ✅

5. ☐ **Verificar PDF final**:
   - Firmar con ambas partes (locador y locatario)
   - ¿Llegó el email con el PDF final? ✅
   - Descargar el PDF
   - ¿Tiene ambas firmas? ✅

---

## 🎉 ¡FELICITACIONES!

Si todos los checks están en ✅, tu sistema FDS está **100% FUNCIONAL** en producción.

---

## 📞 SOPORTE

Si algo no funciona:

1. **Verificar logs en Vercel**:
   - Dashboard > tu proyecto > Deployments > click en el último
   - Ver "Runtime Logs"

2. **Verificar logs en Supabase**:
   - Logs > Database > ver errores

3. **Problemas comunes**:
   - "No llegan emails" → Verificar credenciales SMTP
   - "Error 401" → Verificar variables de Supabase
   - "Redirect error" → Verificar URLs en Supabase Auth

---

## 🔄 ACTUALIZACIONES FUTURAS

Para actualizar el sistema:

```bash
# 1. Hacer cambios en tu código local
# 2. Commit
git add .
git commit -m "Descripción de cambios"

# 3. Push a GitHub
git push

# 4. Vercel automáticamente hace redeploy
# No necesitas hacer nada más!
```

---

## 📊 MONITOREO

### En Vercel:
- **Analytics**: Ver visitas, performance
- **Logs**: Ver errores en tiempo real
- **Deployments**: Historial de todos los deploys

### En Supabase:
- **Database**: Ver todas las tablas y datos
- **Storage**: Ver archivos subidos (PDFs, firmas)
- **Auth**: Ver usuarios registrados
- **Logs**: Ver queries y errores

---

**¿TODO CLARO?** Si seguiste todos los pasos, tu sistema debería estar funcionando perfectamente. 🚀

*Desarrollado con ❤️ por DasLATAM*
