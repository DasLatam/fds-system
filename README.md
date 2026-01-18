# FDS System (MVP) — Next.js + Supabase + Resend + Upstash

Herramienta de **Firma Digital Simple (FDS)** para Argentina (Ley 25.506) — MVP.

## Qué hace (MVP)

1) Creador (logueado con Supabase Auth) sube un PDF.
2) Define firmantes (emails) y el sistema envía un link único con Resend.
3) El firmante abre el link, ve el PDF y firma en un canvas.
4) El backend genera un PDF final con:
   - Firma estampada (imagen PNG)
   - Página adicional de auditoría ("Sello FDS") con:
     - Hash SHA-256 del PDF original
     - IP (x-forwarded-for)
     - Timestamp ISO del servidor
5) Se notifica a creador + firmantes con link de descarga.

> Nota legal/tech: este MVP imprime un timestamp de servidor. Para **timestamp certificado**, integrar TSA (RFC 3161) y guardar el token.

---

## Requisitos

- Node 20+
- Cuenta en Supabase
- Resend API key
- Upstash Redis

---

## Setup Supabase

1) Crear proyecto.
2) Ejecutar `supabase.sql` en SQL Editor.
3) Crear bucket de Storage llamado **fds** (recomendado: PRIVATE).

### Storage policies (recomendado)

Para este MVP, el backend usa `SUPABASE_SERVICE_ROLE_KEY` para upload/download.
Si el bucket es **private**, no hace falta abrir policies públicas.

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar.

En Vercel, cargar las mismas variables en **Project Settings → Environment Variables**.

---

## Run local

```bash
npm install
npm run dev
```

- Ir a `/login`
- Entrar con Magic Link
- Ir a `/dashboard`

---

## Endpoints

- `POST /api/upload` (multipart): sube PDF y crea `documents`
- `POST /api/invite`: crea `signing_requests` y envía emails
- `GET /api/signing-request/:token`: devuelve info + signed URL del PDF original
- `POST /api/sign`: estampa firma + sello, sube final, notifica
- `GET /api/download?path=...`: redirect a signed URL

---

## Deploy a Vercel

1) Subir repo.
2) Setear variables.
3) Deploy.

---

## Estructura

- `app/dashboard` creador
- `app/s/[token]` firmante
- `lib/pdf/signPdf.ts` pdf-lib (firma + página sello)
- `middleware.ts` rate limiting (Upstash) + auth gate

