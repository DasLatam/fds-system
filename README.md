# 📝 FDS v2.0 - Firma Digital Simple

Sistema profesional de firma digital con validez legal en Argentina.

## 🚀 Características

- ✅ Registro de particulares y empresas con datos completos
- ✅ Subida de PDFs para firmar
- ✅ Múltiples firmantes por documento
- ✅ Notificaciones automáticas por email (Resend)
- ✅ Dashboard de administración
- ✅ Dashboard de usuario
- ✅ Firma digital con validez legal (Ley 25.506)
- ✅ Tracking de firmas en tiempo real
- ✅ Templates para inmobiliarias (próximamente)

## 📦 Instalación

### 1. Clonar/Descomprimir el proyecto

```bash
cd tu-directorio
# Ya tienes los archivos descomprimidos
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

**En Supabase → SQL Editor:**

Ejecuta TODO el contenido de `DATABASE.sql`

Esto creará:
- Tabla `organizations` (usuarios)
- Tabla `documents` (documentos para firmar)
- Tabla `signers` (firmantes)
- Storage bucket para PDFs
- Triggers y funciones
- Usuario admin inicial

### 4. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
RESEND_API_KEY=re_tu_api_key_aqui
```

### 5. Configurar DNS en Ferozo

Para que funcionen los emails, agrega en Ferozo estos registros DNS:

#### Record 1 - DKIM
```
Tipo: TXT
Host: resend._domainkey
Valor: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+VKPhYSZae6+7dUQiTrO3NWuA9JJl58YAHKegHFtpd2qqgWlYMdDHzh9epItA6eMyXLUcnuAr4HPKRGN36pIHEDSh0lk3Vt39bZqCwX8hGA6KFmqwaYltcP7zq6lWDPwKkcCoYfJANY4ElXBsXMGwprHOYamMVauFGD4GXYXAkwIDAQAB
TTL: 3600
```

#### Record 2 - SPF
```
Tipo: TXT
Host: send
Valor: v=spf1 include:amazonses.com ~all
TTL: 3600
```

#### Record 3 - MX
```
Tipo: MX
Host: send
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10
TTL: 3600
```

**Espera 10-30 minutos para propagación DNS**

### 6. Configurar SMTP en Supabase

**Supabase → Project Settings → Auth → SMTP Settings:**

```
Enable custom SMTP: ON

Sender name: FDS
Sender email: noreply@daslatam.org

Host: smtp.resend.com
Port: 465

Username: resend
Password: re_tu_api_key (tu API key de Resend)
```

**Click "Save changes"**

### 7. Ejecutar en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

### 8. Deploy en Vercel

```bash
# Conecta tu repo a Vercel
vercel

# Agrega las variables de entorno en Vercel Dashboard
```

## 📱 Uso

### Como Admin

1. Login con `firmadigitalsimple@daslatam.org` / tu password
2. Ve a Dashboard Admin
3. Aprueba organizaciones pendientes
4. Monitorea todos los documentos

### Como Usuario/Empresa

1. Registrarse en `/registro`
2. Completar datos (individual o empresa)
3. Esperar aprobación del admin
4. Acceder al dashboard
5. Crear documentos
6. Agregar firmantes
7. Enviar invitaciones

### Como Firmante

1. Recibir email con link de firma
2. Click en el link
3. Revisar documento
4. Firmar digitalmente
5. Recibir confirmación

## 🗂️ Estructura del Proyecto

```
fds-v2/
├── app/
│   ├── auth/              # Login
│   ├── registro/          # Registro con todos los campos
│   ├── dashboard/
│   │   ├── admin/        # Panel admin
│   │   └── user/         # Panel usuario
│   ├── firma/[id]/       # Página de firma
│   ├── legal/            # Términos y privacidad
│   └── api/              # Rutas API
├── components/           # Componentes React
├── lib/
│   ├── supabase/        # Cliente Supabase
│   └── email-templates.ts
├── public/              # Assets estáticos
└── DATABASE.sql         # SQL completo para Supabase
```

## 🔒 Seguridad

- Encriptación SSL/TLS
- Autenticación con Supabase Auth
- Tokens únicos por firmante
- Registro de IP y metadata de firma
- Storage seguro de documentos

## 📄 Legal

El sistema cumple con:
- ✅ Ley 25.506 de Firma Digital (Argentina)
- ✅ Código Civil y Comercial
- ✅ Ley de Protección de Datos Personales

## 🆘 Soporte

Email: firmadigitalsimple@daslatam.org

## 📝 Licencia

© 2026 DasLATAM - Todos los derechos reservados

---

**¡Listo para usar!** 🚀

Si tienes problemas:
1. Verifica que el SQL se ejecutó correctamente
2. Verifica que las variables de entorno están configuradas
3. Verifica que los DNS de Resend están configurados
4. Revisa la consola del navegador para errores
