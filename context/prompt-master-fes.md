Perfecto. Acá tenés un **prompt “master”** para abrir una conversación nueva y que el asistente tenga **todo el contexto funcional** de FES, lo que ya está construido, y cómo trabajaremos por etapas. Está escrito para que lo puedas pegar tal cual y después ir “recortando” en sprints.

> Importante: este prompt está pensado para **describir requisitos y workflows**, no para meter logs ni código. Al final te dejo el “paquete mínimo” de evidencias que conviene adjuntar en cada sprint.

---

## Prompt master (copiar/pegar en una conversación nueva)

**Rol:** Actuá como Arquitecto Senior Full-stack (Next.js 16 App Router + Supabase + Resend + Upstash) y debugging de producción en Vercel.
**Producto:** Firma Electrónica Simple (FES) – República Argentina – Ley 25.506 art. 5 (firma electrónica simple, NO firma digital certificada).
**URL prod:** [https://firmasimple.vercel.app](https://firmasimple.vercel.app)

### 0) Objetivo general

Terminar una plataforma funcional de Firma Electrónica Simple con:

* Login por magic link (estable).
* Dashboard de documentos (creación, listado, eliminación de borradores vacíos).
* Flujo de invitación a firmantes (emails, tokens, reenvío).
* Página pública para firmar por token (sin login obligatorio).
* Registro de evidencia (hash, timestamps, IP, user-agent y datos del firmante).
* Descarga/visualización del documento finalizado.
* Páginas legales (Términos y Privacidad) visibles públicamente.

**Regla de trabajo:** se avanza por **sprints** con scope acotado. En cada sprint se toca lo mínimo posible y se valida con checklist (curl + UI). No se mezclan problemas.

---

## 1) Stack y arquitectura actual (ya implementada)

* Next.js 16 App Router, deploy en Vercel.
* Supabase:

  * Auth (magic link).
  * Postgres con tablas: `documents`, `profiles`, `signing_requests`, `audit_logs` (u otra tabla de eventos/auditoría).
  * Storage bucket: `fds` (PDF originales, firmas, finalizados).
* Emails:

  * Resend para envío de magic link y para invitaciones de firma.
  * (Opcional) fallback a Supabase OTP si Resend falla.
* Upstash Redis (rate-limit / protección de endpoints).
* Middleware para proteger rutas privadas (`/dashboard`, `/admin`, y APIs privadas), permitiendo rutas públicas (`/s/[token]`, `/api/sign`, `/api/signing-request/*`, `/api/preview`, `/api/auth/*`).

---

## 2) Roles y permisos

* Usuario autenticado (creador): puede subir documentos, ver dashboard, invitar firmantes, reenviar invitaciones, eliminar documentos “vacíos”.
* Firmante externo: no necesita login para abrir `/s/[token]` y firmar (token actúa como autorización).
* Admin del sistema: existe el concepto, pero puede estar incompleto. Usuario “[ariel@baudry.com.ar](mailto:ariel@baudry.com.ar)” es admin lógico (pendiente de panel admin completo).

---

## 3) Workflows y casos de uso (lo que esperamos)

### 3.1 Login por Magic Link (para dashboard)

**Pantalla:** `/login` (o home con CTA “Ingresar”).
**Acción:** ingresar email → “Enviar link”.
**UX esperado:**

* El botón muestra estado loading (cursor, spinner y/o texto “Enviando…”).
* Luego muestra confirmación: “Te enviamos un link de acceso a tu email.”
* Email llega con asunto **no agrupable** (incluye fecha y hora).
  **Callback esperado:**
* El link lleva al usuario a `/auth/callback-client` (hash `#access_token`) y luego a `/dashboard`.
* No debe haber `missing_code`, `set_session_failed` ni loops.
* Si el usuario no existe, se crea o se permite login igual (según configuración Supabase).

**Rutas clave:**

* `/auth/callback-client` + `/api/auth/set-session` (setea cookies).
* Middleware no debe bloquear estos endpoints.

### 3.2 Onboarding de Identidad (perfil)

**Pantalla:** “Tu identidad” (si el usuario no completó perfil).
Campos requeridos:

* Nombre completo
* DNI
* CUIL
* Dirección postal
* Celular

**Textos/UX:**

* Mostrar placeholders/ejemplos (ej: “Juan Pérez”, “30123456”, “20301234567”, etc.).
* Mensaje: “Estos datos se usan para trazabilidad y evidencia de firma.”
* Botón: “Guardar”
* Errores claros (si falla DB).
* Al guardar, volver a dashboard.

### 3.3 Dashboard (documentos)

**Pantalla:** `/dashboard`

* Encabezado: “Dashboard”
* CTA: “Subir PDF”
* CTA: “Mis datos”
* CTA: “Salir”
  **Listado de documentos:**
* Cada documento muestra: título, estado (pending/finalized/etc), modo firma (parallel/sequential), contador de firmantes.
* Acciones por documento:

  * “Ver” (detalle del documento en dashboard).
  * “Eliminar” solo si está “vacío” (sin firmantes ni firmas) o si está vencido/sin uso (regla a definir).
  * “Firmar” si el usuario logueado también es firmante pendiente (si existe `signing_request` para su email).

**Problemas ya detectados:**

* Documentos incompletos aparecen con 0/0 firmantes y deberían poder eliminarse.
* UI: en reenvío aparece scroll lateral (mejorar).

### 3.4 Subir documento

**Pantalla:** `/dashboard/new`

* Selector de archivo debe verse como botón claro.
* Al subir, debe guardar el PDF en storage y crear registro en `documents`.
* Luego debe permitir ver detalle del documento.

### 3.5 Detalle del documento

**Pantalla:** `/dashboard/doc/[id]`

* Debe mostrar datos del documento.
* Debe permitir invitar firmantes:

  * emails (1 o más)
  * modo parallel/sequential
  * vencimiento (opcional)
* Debe mostrar firmantes y estado.
* Debe permitir reenviar invitación a firmantes.

### 3.6 Invitación a firmantes (email)

* Al invitar, se crean filas `signing_requests` con:

  * token (uuid)
  * document_id
  * email
  * status pending
  * expires_at
  * position (si sequential)
  * opened_at, email_sent_at (si existen)
* Se envía email por Resend con link:

  * `https://firmasimple.vercel.app/s/<token>`
* Reenviar invitación:

  * No debe mostrar JSON pelado en pantalla.
  * Debe preservar UX (volver al doc o mostrar toast).
  * Si se rota token, el link anterior debe mostrar mensaje consistente (“reemplazado por reenvío”).

### 3.7 Página pública de firma

**Pantalla:** `/s/[token]` (pública)
Debe mostrar:

* Título del documento
* “Firmante:” (email del firmante)
* “Modo:” (parallel/sequential + orden si sequential)
* Estado: pendiente/firmado/rechazado/vencido
* Vista previa del PDF (preferible inline, con botón real “Abrir PDF”)
* Datos del firmante (prellenables si vienen de perfil, si aplica)
* Consentimiento: checkbox con texto legal (Ley 25.506 art. 5)
* Firma manuscrita: canvas con “✅ Firma capturada”
* Botón “Firmar” habilitado solo si:

  * status pending
  * consentimiento aceptado
  * datos completos
  * firma capturada
* Botón “Rechazar” con motivo (mínimo 3 chars)

**Registro de evidencia al firmar:**

* hash del documento (si se implementa)
* timestamp signed_at
* signer_ip
* user-agent
* datos del firmante
* ruta de firma en storage (signature_path)
* auditoría (evento)

**Importante:** `/api/sign` NO debe requerir sesión (token autoriza).

### 3.8 Documento finalizado

* Cuando todos firman (o regla definida), estado pasa a finalizado.
* Se puede descargar el PDF final (con evidencias y/o al menos con registro).
* Email final opcional al creador y firmantes con link de descarga.

---

## 4) Requisitos de UX/Copy/Legal (ya presentes y a mantener)

* Header con navegación: Planes, Términos, Privacidad, Ingresar
* Footer con disclaimer:

  * “Este servicio implementa firma electrónica conforme a la Ley 25.506 (República Argentina). No constituye firma digital certificada…”
* Textos en español, consistentes.
* Estilo: simple, limpio, botones claros, feedback de loading.

---

## 5) Restricciones

* No romper deploy en Vercel.
* Cambios mínimos por sprint (preferencia: 1–3 archivos por sprint).
* No cambiar features ajenas al sprint.
* Evitar regresiones: cada sprint incluye checklist de verificación.

---

## 6) Metodología de trabajo (obligatoria)

Trabajamos por sprints con un objetivo único:

* Sprint N: “X funciona end-to-end”.
  Cada sprint debe incluir:

1. causa exacta del bug
2. cambios mínimos (archivos completos)
3. checklist con curl y UI

No se mezclan sprints.

---

## 7) Datos y evidencias que voy a adjuntar por sprint (no todo junto)

* El archivo o ruta afectada (ej: `app/api/sign/route.ts`)
* 1 log relevante de Vercel (json)
* 1 log relevante de Supabase (postgres/auth/storage)
* Un HAR si el problema es de red
* Captura de pantalla solo si aporta al UX

---

**Tu primera tarea en esta conversación:**

1. Convertí todo lo anterior en un **mapa de sistema** (pantallas, endpoints, tablas, estados).
2. Proponé un plan de sprints (orden correcto) con criterios de aceptación.
3. Elegí el Sprint 1 (más crítico) y definí el checklist de verificación.

---

## Para que este método funcione sin que se cuelgue el chat

* Nunca pegues logs completos en el chat: adjuntalos como archivo.
* Cada mensaje tuyo debe empezar con: **Sprint #X – síntoma actual – link/endpoint**.
* Si el chat se pone lento, cerramos y abrimos otro usando este prompt como base, sin intentar “rescatar” el historial.

---

### Si querés, te lo dejo aún más “operativo”

Decime si preferís que el plan de sprints arranque por:
A) Firma end-to-end (sin importar dashboard)
B) Login estable primero
C) Invitación + token estable primero

Si no querés elegir, yo elijo el orden óptimo.

---

Si querés, además te puedo dar una **versión “corta” del prompt** (10 líneas) para usar en cada sprint, y el master queda como documento de referencia.









Excelente. El prompt está **muy bien armado**: es claro, operativo y, sobre todo, *defiende al proyecto* de que el asistente se disperse o rompa cosas. Vamos directo a cumplir **la primera tarea** que definiste.

---

# 1) Mapa del sistema (visión completa y compacta)

## 1.1 Pantallas (UI)

### Públicas

* `/`

  * Landing + CTA “Ingresar”
  * Links legales
* `/login`

  * Input email
  * Envío magic link
* `/s/[token]`

  * Firma pública por token
  * Vista PDF
  * Consentimiento + firma
* `/terms`
* `/privacy`

### Privadas (auth requerida)

* `/dashboard`

  * Listado documentos
  * CTA subir PDF
* `/dashboard/new`

  * Subida de documento
* `/dashboard/doc/[id]`

  * Detalle documento
  * Invitación firmantes
  * Reenvío
* `/profile` (o modal)

  * Identidad del usuario

### Técnicas

* `/auth/callback-client`

  * Recibe magic link
  * Setea sesión

---

## 1.2 Endpoints (API)

### Auth

* `POST /api/auth/set-session`

  * Set cookies Supabase
* `POST /api/auth/magic-link`

  * Envío login email (Resend)

### Documentos

* `POST /api/documents`
* `GET /api/documents`
* `DELETE /api/documents/:id`
* `GET /api/documents/:id`

### Firma

* `POST /api/signing-request`
* `POST /api/signing-request/resend`
* `GET /api/signing-request/:token`
* `POST /api/sign`

  * **Público, sin sesión**

### Preview / storage

* `GET /api/preview/:docId`

---

## 1.3 Tablas (Supabase)

### `profiles`

* user_id (PK)
* full_name
* dni
* cuil
* address
* phone
* created_at

### `documents`

* id (PK)
* owner_id
* title
* status (draft | pending | finalized)
* signing_mode (parallel | sequential)
* file_path
* created_at

### `signing_requests`

* id
* document_id
* email
* token
* status (pending | signed | rejected | expired)
* position
* expires_at
* email_sent_at
* opened_at
* signed_at

### `audit_logs`

* id
* document_id
* event_type
* metadata (json)
* created_at

---

## 1.4 Estados críticos

### Documento

* `draft`
* `pending`
* `finalized`

### Signing request

* `pending`
* `signed`
* `rejected`
* `expired`

---

# 2) Plan de sprints (orden óptimo)

👉 **Criterio:** desbloquear valor *end-to-end* lo antes posible, pero sin que el sistema sea inestable.

---

## Sprint 1 – Login por Magic Link estable (CRÍTICO)

**Objetivo:** un usuario puede entrar al dashboard sin loops ni errores.

**Por qué primero**

* Sin auth estable, todo debugging posterior es ruido
* Hoy es fuente de errores (`missing_code`, loops)

**Aceptación**

* Login funciona 10/10
* Cookies correctas
* Middleware no bloquea callbacks

---

## Sprint 2 – Página pública `/s/[token]` funcional

**Objetivo:** firmante externo puede abrir link y ver documento.

**Aceptación**

* Token válido carga data
* Token inválido muestra mensaje claro
* No requiere sesión

---

## Sprint 3 – Firma efectiva + evidencia

**Objetivo:** firmar cambia estado y guarda auditoría.

---

## Sprint 4 – Invitación + reenvío

**Objetivo:** emails confiables, UX limpia, sin JSON crudo.

---

## Sprint 5 – Dashboard limpio

**Objetivo:** eliminar docs vacíos, estados claros, UX estable.

---

## Sprint 6 – Documento finalizado + descarga

**Objetivo:** cerrar ciclo legal.

---

# 3) Sprint 1 elegido (crítico)

## 🟦 Sprint #1 – Login Magic Link estable – `/login → /dashboard`

### Síntoma actual (esperado)

* Loops
* `missing_code`
* `set_session_failed`
* Middleware bloqueando `/auth/*`

---

## Alcance EXACTO

**Solo:**

* `/login`
* `/auth/callback-client`
* `/api/auth/set-session`
* `middleware.ts`

❌ No tocar dashboard
❌ No tocar firma
❌ No tocar emails de firmantes

---

## Checklist de verificación

### UI

* [ ] Botón muestra loading
* [ ] Mensaje “Te enviamos un link…”
* [ ] Click en email redirige correctamente
* [ ] Llega a `/dashboard`

### Red

* [ ] No hay redirect loop
* [ ] `access_token` presente
* [ ] Cookie `sb-access-token` seteada

### Logs

* [ ] No aparece `missing_code`
* [ ] No aparece `AuthApiError`

### Curl

```bash
curl -I https://firmasimple.vercel.app/auth/callback-client
```

* [ ] 200 o redirect válido
* [ ] No 401
* [ ] No 307 infinito

---

## Resultado esperado del Sprint 1

👉 **Podés loguearte siempre**, incluso después de limpiar cookies.

---

# Cierre (importante)

Tu enfoque es **el correcto para producción**:

* scope chico
* checklist
* cero magia
* cero “ya que estamos”

Cuando quieras:

* arrancamos **Sprint #1**
* me mandás **solo**:

  * el/los archivos involucrados
  * 1 log relevante

Si el chat se pone pesado: **se cierra sin culpa** y este prompt vuelve a vivir.


-Estoy usando Visual Studio Code en mi macbook
-Estoy subiendo los archivo por terminal
-Estoy subiendo el código a github, cada modificacion dame el script de subida con el comentario
-Probamos todo en produccion en https://firmasimple.vercel.app/


Adjunto el contexto general en PROMPT FES.txt



1) Estado actual de FES en producción

Producción: https://firmasimple.vercel.app/

Flujo end-to-end (OK)

Autenticación por magic link (Supabase Auth).

Emails transaccionales con Resend.

Creación de documento desde /dashboard/new con subida estable de PDF.

Invitaciones por email a firmar.

Página pública /s/<token>:

firma manuscrita

consentimiento

datos del firmante

IP + timestamps

Finalización automática cuando firman todos:

genera audit_code

calcula y guarda final_hash_sha256

sube final.pdf a Storage (final_path)

setea documents.status = signed y completed_at

PDF final:

marca electrónica en todas las páginas

constancia con firmas (reducidas ~50%)

aclaración (nombre/DNI)

QR a /v/<audit_code>

constancia multipágina si hay muchas firmas

Validación pública independiente: /v/<audit_code>

usuario sube PDF final

SHA-256 local vs documents.final_hash_sha256

registra métricas en verification_events

Auditoría (ARREGLADO y CONFIRMADO)

Se corrigió el constraint audit_events_event_type_check para permitir nuevos eventos.

Ahora se registran en audit_events:

document_completed

completion_email_sent / completion_email_failed

Confirmado por tu query: aparecen document_completed y completion_email_sent junto a invite_created y email_sent.

Email finalizado (OK)

El email “Documento finalizado” llega nuevamente.

Se corrigió el problema del dominio en Resend ajustando el sender / RESEND_FROM.

UX dashboard (OK)

Botón principal: “Nueva Firma” (verde).

Métricas visibles en dashboard:

documentos total / firmados / pendientes

firmas completadas vs totales

verificaciones últimos 7 días

verificaciones 30 días con OK/NO

“Tus documentos” arriba con:

buscador/filtros

archivar (UI sin DB) + auto-ocultar firmados con +7 días

ver archivados

“Actividad reciente” abajo.

Detalle del documento:

botonera con “Volver” alineada

firmantes deshabilitados si documento firmado

auditoría del documento (últimos 25) (ahora muestra lo de finalización)

2) Pendientes (lista priorizada)
P0 — Estabilidad / seguridad del flujo

PDF encriptado: si el original está protegido puede fallar PDFDocument.load (ya lo viste antes).

Fix recomendado: cargar con ignoreEncryption: true y/o bloquear PDFs encriptados en upload con mensaje claro.

Rollback si falla finalización: hoy puede quedar el link en estado no reintentable (“Link not pending”) si falla luego de marcar firmado.

Fix recomendado: transacción lógica (o rollback de signing_requests.status y documents.signed_count) si falla la generación/subida del final.

Homologar event_type: ya tenés pdf_finalized y ahora document_completed. Definir cuáles son “oficiales” y eliminar debug/ruido.

P1 — Sprint “Métricas visibles” (pro)

Métricas más completas:

tasas OK/NO de verificación

verificaciones por documento (top)

emails fallidos por período

“Actividad reciente” más legible:

labels amigables por event_type

link directo al documento desde el evento

P2 — Panel de administrador (ariel@baudry.com.ar
)

/admin:

ver todos los docs y usuarios

métricas globales

pausar usuarios

ver fallas de emails (completion_email_failed)

búsquedas + filtros + export (opcional)

P3 — Registro de cuentas (Personal vs Empresa)

Perfil:

tipo de cuenta

firma en representación (empresa + rol)

datos adicionales de empresa

impacto en constancia PDF y auditoría

P4 — UX/Legal fino

Copy y microcopy (errores, tooltips, disclaimers)

Plantillas de emails (versionado)

Versionado de consentimiento y mejorar constancia PDF (secciones, formato)

Pantalla “Nueva Firma” con:

“Redactar” (editor rico) (pendiente real)

“Plantillas” (enunciado hoy, implementación futura)