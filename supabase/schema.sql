-- FDS System - Supabase SQL (v0.2)
-- Ejecutar en Supabase SQL Editor.
-- Incluye: documentos, solicitudes de firma, auditoría, perfiles y funciones auxiliares.

create extension if not exists "uuid-ossp";

-- =====================
-- Profiles (identidad)
-- =====================
create table if not exists public.profiles (
  user_id uuid primary key,
  email text,
  full_name text,
  dni text,
  cuil text,
  address text,
  phone text,
  is_paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- =====================
-- Documents
-- =====================
create table if not exists public.documents (
  id uuid primary key,
  created_by uuid not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending','signed')),
  signing_mode text not null default 'parallel' check (signing_mode in ('parallel','sequential')),
  total_signers int not null default 0,
  signed_count int not null default 0,
  completed_at timestamptz,

  original_path text not null,
  final_path text,
  original_hash text,

  tsa_url text,
  tsa_token_base64 text,
  tsa_token_sha256 text,
  tsa_created_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists documents_created_by_idx on public.documents(created_by);

-- =====================
-- Signing requests
-- =====================
create table if not exists public.signing_requests (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  email text not null,
  token uuid not null unique,
  status text not null default 'pending' check (status in ('pending','signed','rejected','expired')),
  position int,
  expires_at timestamptz,

  invited_at timestamptz,
  email_sent_at timestamptz,
  opened_at timestamptz,
  viewed_at timestamptz,

  signed_at timestamptz,
  signer_ip text,
  signature_hash text,

  -- Datos declarados por el firmante al momento de firmar
  signer_full_name text,
  signer_dni text,
  signer_cuil text,
  signer_address text,
  signer_phone text,

  rejected_at timestamptz,
  rejection_reason text,

  created_at timestamptz not null default now()
);

create index if not exists signing_requests_document_id_idx on public.signing_requests(document_id);
create index if not exists signing_requests_token_idx on public.signing_requests(token);
create index if not exists signing_requests_status_idx on public.signing_requests(status);

-- =====================
-- Audit events
-- =====================
create table if not exists public.audit_events (
  id bigserial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  signing_request_id uuid references public.signing_requests(id) on delete cascade,
  actor_user_id uuid,
  actor_email text,
  event_type text not null check (event_type in (
    'doc_created','pdf_uploaded','invite_created','email_sent',
    'link_opened','pdf_viewed','signature_submitted','invitation_rejected',
    'invitation_expired','tsa_timestamped','pdf_finalized'
  )),
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_doc_idx on public.audit_events(document_id, created_at desc);
create index if not exists audit_events_req_idx on public.audit_events(signing_request_id, created_at desc);

-- =====================
-- Helper function: signed_count
-- =====================
create or replace function public.increment_signed_count(p_document_id uuid)
returns void
language plpgsql
as $$
begin
  update public.documents
  set signed_count = signed_count + 1
  where id = p_document_id;
end;
$$;

-- =====================
-- RLS
-- =====================
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.signing_requests enable row level security;
alter table public.audit_events enable row level security;

-- Clean existing policies (safe to rerun)
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_upsert_own on public.profiles;

drop policy if exists documents_select_own on public.documents;
drop policy if exists documents_insert_own on public.documents;
drop policy if exists documents_update_own on public.documents;

drop policy if exists audit_events_select_own on public.audit_events;

-- Profiles: user can read/update own
create policy profiles_select_own
on public.profiles for select
using (user_id = auth.uid());

create policy profiles_upsert_own
on public.profiles for insert
with check (user_id = auth.uid());

create policy profiles_update_own
on public.profiles for update
using (user_id = auth.uid());

-- Documents: users see/manage only their docs
create policy documents_select_own
on public.documents for select
using (created_by = auth.uid());

create policy documents_insert_own
on public.documents for insert
with check (created_by = auth.uid());

create policy documents_update_own
on public.documents for update
using (created_by = auth.uid());

-- Audit events: only doc owner can read
create policy audit_events_select_own
on public.audit_events for select
using (
  exists (
    select 1 from public.documents d
    where d.id = audit_events.document_id and d.created_by = auth.uid()
  )
);

-- Signing requests are handled by server-side routes using service_role.
-- Keep RLS restrictive (no public access).
