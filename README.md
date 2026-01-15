# FDS - Firma Digital Simple

Sistema de gestión y firma digital de contratos de alquiler temporario desarrollado por **DasLATAM**.

## 📋 Características

✅ **Autenticación sin contraseña** (Magic Links via Supabase)
✅ **3 Roles**: Inmobiliaria, Locador, Locatario
✅ **Creación de contratos** con formulario completo
✅ **Generación automática de PDFs** basados en template
✅ **Sistema de firmas digitales** con canvas
✅ **Notificaciones automáticas** por email en cada paso
✅ **Storage de PDFs** en Supabase
✅ **100% Responsive** y mobile-friendly

### 🔒 SEGURIDAD ROBUSTA (NUEVO v2.0)
✅ **Rate limiting** anti-spam con Upstash Redis
✅ **Expiración de tokens** (30 días automático)
✅ **Auditoría completa** con tracking de IP y user agent
✅ **HTTPS obligatorio** con certificado SSL/TLS
✅ **Backup automático diario** vía Supabase
✅ **Row Level Security** (RLS) en base de datos

### ⚖️ CUMPLIMIENTO LEGAL (NUEVO v2.0)
✅ **Ley 25.506** - Firma Digital Argentina
✅ **Ley 25.326** - Protección de Datos Personales
✅ **Art. 288 CCyC** - Validez jurídica de firma digital
✅ **Términos y Condiciones** página completa
✅ **Política de Privacidad** GDPR-compliant
✅ **Consentimiento explícito** popup antes de firmar
✅ **Derechos GDPR** implementados (acceso, olvido, portabilidad)

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Emails**: SMTP (Ferozo)
- **PDFs**: pdf-lib
- **Hosting**: Vercel

## 🚀 Instalación Local

### Prerequisitos

- Node.js 18+ instalado
- Cuenta en Supabase (gratuita)
- Cuenta en Vercel (gratuita)

### Paso 1: Clonar el Proyecto

```bash
# Si tienes el proyecto en un ZIP, descomprimirlo
# Si está en GitHub:
# git clone https://github.com/tu-repo/fds-system.git
cd fds-system
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Supabase

1. Crear un nuevo proyecto en [Supabase](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el script `supabase-schema.sql`
3. Ir a **Storage** y verificar que se creó el bucket `contracts`
4. Copiar las credenciales del proyecto:
   - Project URL
   - Anon/Public Key
   - Service Role Key (desde Settings > API)

### Paso 4: Configurar Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```bash
# Copiar desde .env.example
cp .env.example .env.local
```

Editar `.env.local` con tus valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# SMTP (Ferozo)
SMTP_HOST=va000847.ferozo.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=firmadigitalsimple@daslatam.org
SMTP_PASS=tu_password_smtp_aqui

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 5: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📦 Deploy en Vercel

### Opción 1: Deploy desde GitHub

1. Subir el proyecto a GitHub
2. Ir a [Vercel](https://vercel.com)
3. Click en **"Add New Project"**
4. Importar tu repositorio de GitHub
5. Configurar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `NEXT_PUBLIC_APP_URL` (será `https://tu-proyecto.vercel.app`)
6. Click en **"Deploy"**

### Opción 2: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Login en Vercel
vercel login

# Deploy
vercel

# Configurar las variables de entorno en el dashboard de Vercel
```

### Paso Importante: Actualizar URLs

Después del deploy, actualizar estas URLs:

1. **En Supabase**:
   - Ir a **Authentication** > **URL Configuration**
   - Agregar tu URL de Vercel en **Site URL**: `https://tu-proyecto.vercel.app`
   - Agregar en **Redirect URLs**: `https://tu-proyecto.vercel.app/auth/callback`

2. **En Vercel**:
   - Actualizar la variable `NEXT_PUBLIC_APP_URL` con tu URL de producción

## 📝 Uso del Sistema

### Como Inmobiliaria

1. **Registrarse**: Ir a `/auth` e ingresar tu email
2. **Magic Link**: Revisar email y hacer click en el enlace
3. **Dashboard**: Serás redirigido al dashboard de inmobiliaria
4. **Crear Contrato**: Click en "Nuevo Contrato"
5. **Completar Formulario**: Llenar todos los datos del locador, locatario e inmueble
6. **Enviar**: El sistema automáticamente:
   - Genera el PDF del contrato
   - Envía emails al locador y locatario con links únicos
   - Crea los registros en la base de datos

### Como Locador o Locatario

1. **Recibir Email**: Llegarán un email con el enlace para firmar
2. **Revisar Contrato**: Ver todos los detalles y descargar el PDF
3. **Firmar**: Dibujar la firma en el canvas
4. **Confirmar**: Click en "Confirmar y Firmar Contrato"
5. **Listo**: Recibirás un email cuando ambas partes hayan firmado

## 📁 Estructura del Proyecto

```
fds-system/
├── app/
│   ├── api/                    # API Routes
│   │   ├── contracts/
│   │   │   └── create/
│   │   └── signatures/
│   │       ├── verify/
│   │       └── sign/
│   ├── auth/                   # Autenticación
│   │   └── callback/
│   ├── dashboard/              # Dashboards
│   │   ├── inmobiliaria/
│   │   ├── locador/
│   │   └── locatario/
│   ├── firma/                  # Sistema de firmas
│   │   ├── [token]/
│   │   └── exito/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                 # Componentes React
│   ├── ContractsList.tsx
│   ├── NuevoContratoForm.tsx
│   └── SignaturePage.tsx
├── lib/                        # Utilidades
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── email.ts
│   └── pdf-generator.ts
├── types/                      # TypeScript types
│   └── index.ts
├── public/                     # Archivos estáticos
│   ├── logo.png
│   └── template-contrato.pdf
├── middleware.ts               # Middleware de Next.js
├── supabase-schema.sql         # Schema de la base de datos
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 🔧 Configuración Avanzada

### Personalizar el Template PDF

El template del PDF está en `public/template-contrato.pdf`. Para personalizarlo:

1. Editar el PDF con Adobe Acrobat o herramientas similares
2. Reemplazar el archivo en `public/`
3. Ajustar las coordenadas en `lib/pdf-generator.ts` si es necesario

### Personalizar Emails

Los templates de email están en `lib/email.ts`. Puedes modificar:

- Diseño HTML
- Textos
- Estilos
- Logo (cambiar la URL)

### Añadir Campos al Contrato

1. Actualizar el schema SQL en `supabase-schema.sql`
2. Agregar el campo en `types/index.ts` (interface Contract)
3. Añadir el campo en el formulario (`components/NuevoContratoForm.tsx`)
4. Actualizar la API de creación (`app/api/contracts/create/route.ts`)
5. Actualizar el generador de PDF (`lib/pdf-generator.ts`)

## 🐛 Troubleshooting

### Los emails no se envían

- Verificar que las credenciales SMTP sean correctas
- Verificar que el puerto 465 esté abierto
- Revisar los logs del servidor

### Las firmas no aparecen en el PDF

- Verificar que las URLs de las firmas sean públicas
- Verificar que el bucket de Supabase Storage tenga permisos públicos
- Revisar la función `addSignaturesToPDF` en `lib/pdf-generator.ts`

### Error de autenticación

- Verificar que las URLs de callback estén configuradas en Supabase
- Verificar que `NEXT_PUBLIC_APP_URL` sea correcto
- Revisar el middleware (`middleware.ts`)

### Los PDFs no se generan

- Verificar que `template-contrato.pdf` exista en `public/`
- Verificar los permisos del bucket de Storage
- Revisar las coordenadas en `lib/pdf-generator.ts`

## 📄 Licencia

© 2026 DasLATAM. Todos los derechos reservados.

## 🤝 Soporte

Para soporte, contactar a DasLATAM:
- Email: firmadigitalsimple@daslatam.org
- Web: [daslatam.org](https://daslatam.org)

---

Desarrollado con ❤️ por DasLATAM
