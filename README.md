# Firma Digital Simple (FDS)

Proyecto Next.js 16 + Supabase + Resend + Upstash.

## Requisitos
- Node 20+
- Proyecto Supabase con Auth Email (Magic Link) habilitado
- Bucket privado `fds` en Supabase Storage

## Variables de entorno (Vercel / .env.local)

### Public (se exponen al browser)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_APP_URL (ej: https://firmadigitalsimple.vercel.app)

### Server-only
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- RESEND_FROM (ej: "FDS <no-reply@tu-dominio.com>")
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

## Supabase SQL
Ejecutá `supabase.sql` en el SQL editor de Supabase.

## Storage
Crear bucket privado `fds`.

## Desarrollo

```bash
npm install
npm run dev
```
