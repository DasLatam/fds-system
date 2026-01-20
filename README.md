# Firma Electrónica Simple (FES) — Release 1

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Supabase (Auth, Postgres, Storage) + Resend + Upstash Redis.

> Bucket de Storage: **fds** (privado)
> - Original: `{userId}/{docId}/original/original.pdf`
> - Final: `{userId}/{docId}/final/final.pdf`

## 1) Variables de entorno (Vercel / .env.local)

### App
- `NEXT_PUBLIC_APP_URL` = `https://firmasimple.vercel.app`

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server)

### Resend
- `RESEND_API_KEY`
- `RESEND_FROM` (ej: `FES <noreply@tu-dominio.com>`)

### Upstash Redis (Rate limit)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## 2) Supabase

1) Ejecutá `supabase/schema.sql` en el SQL Editor.
2) Storage → Buckets → crear bucket **fds** y marcarlo como **Private**.

## 3) Desarrollo local

```bash
npm install
npm run dev
```

## 4) Producción (Vercel)

- Configurar las env vars en Vercel (All Environments)
- Deploy

## Notas legales

El servicio implementa **firma electrónica** (Ley 25.506, art. 5). No constituye firma digital certificada (Ley 25.506, art. 2).
