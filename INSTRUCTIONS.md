# Instrucciones de Instalación

## 1. Base de Datos

Ejecuta el SQL completo en Supabase SQL Editor (ver el mensaje anterior con todo el SQL)

## 2. Configurar DNS

Agregar en Ferozo:
- TXT: resend._domainkey
- TXT: send (SPF)
- MX: send

## 3. Variables de Entorno

Copia `.env.example` a `.env.local` y configura:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- NEXT_PUBLIC_SITE_URL
- RESEND_API_KEY

## 4. Instalar y Ejecutar

```bash
npm install
npm run dev
```

