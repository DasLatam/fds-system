# Contexto técnico y método — fds-system

## Identificación
- Repo: `fds-system`
- Git: `yes`
- Branch actual: `main`
- Remote origin: `git@github.com:DasLatam/fds-system.git`
- Último commit: `66675f4 2026-01-30T15:58:05-03:00 Ariel Baudry Plans: plan free/pro + límite mensual (server-side)`

## Stack detectado (heurístico)
- Next.js
- App Router
- TypeScript
- Tailwind/PostCSS
- Supabase

## Versiones de herramientas
- Node: `v25.5.0`
- npm: `11.8.0`
- Python: `Python 3.9.6`

## Método de trabajo recomendado
- Reproducir local: instalar deps → correr dev → reproducir bug → validar fix.
- Cambios chicos: 1 objetivo por commit.
- Verificación: flujos críticos (auth, creación, firma, emails).
- Deploy: merge a main → Vercel build → validar en producción.

## Scripts (package.json)
