-- FDS System (v0.2) - Supabase SQL
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

-- Profiles (for Personal + Signer identity)
create table if not exists public.profiles (
  user_id uuid primary key,
  role text not null default 'personal' check (role in ('personal','company')),
  full_name text,
  dni text,
  cuil text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

-- Organizations
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null,
  name text not null,
  cuit text not null,
  address text,
  rep_full_name text,
  rep_dni text,
  rep_cuil text,
  rep_phone text,
  created_at timestamptz not null default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key,
  created_by uuid not null,
  org_id uuid,
  title text not null,
  status text not null default 'pending' check (status in ('pending','signed')),
  signing_mode text not null default 'parallel' check (signing_mode in ('parallel','sequential')),
  total_signers int not null default 0,
  signed_count int not null default 0,
  original_path text not null,
  final_path text,
  original_hash text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Signing requests
create table if not exists public.signing_requests (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  email text not null,
  signer_full_name text,
  signer_dni text,
  signer_cuil text,
  signer_address text,
  signer_phone text,
  token uuid not null unique,
  position int,
  status text not null default 'pending' check (status in ('pending','signed')),
  invited_at timestamptz,
  email_sent_at timestamptz,
  opened_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  signer_ip text,
  signature_hash text,
  created_at timestamptz not null default now()
);

-- Audit events
create table if not exists public.audit_events (
  id bigserial primary key,
  document_id uuid not null references public.documents(id) on delete cascade,
  signing_request_id uuid references public.signing_requests(id) on delete cascade,
  actor_user_id uuid,
  actor_email text,
  event_type text not null check (event_type in (
    'doc_created','pdf_uploaded','invite_created','email_sent',
    'link_opened','pdf_viewed','signature_submitted','pdf_finalized'
  )),
  ip text,
  user_agent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Credits ledger (usage / subscriptions)
create table if not exists public.credits_ledger (
  id bigserial primary key,
  user_id uuid not null,
  kind text not null check (kind in ('grant','consume','purchase')),
  amount int not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists signing_requests_document_id_idx on public.signing_requests(document_id);
create index if not exists signing_requests_token_idx on public.signing_requests(token);
create index if not exists audit_events_doc_idx on public.audit_events(document_id, created_at desc);
create index if not exists credits_ledger_user_idx on public.credits_ledger(user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.documents enable row level security;
alter table public.signing_requests enable row level security;
alter table public.audit_events enable row level security;
alter table public.credits_ledger enable row level security;

-- Policies
create policy "profiles_select_own" on public.profiles for select using (user_id = auth.uid());
create policy "profiles_upsert_own" on public.profiles for insert with check (user_id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (user_id = auth.uid());

create policy "organizations_select_own" on public.organizations for select using (owner_user_id = auth.uid());
create policy "organizations_insert_own" on public.organizations for insert with check (owner_user_id = auth.uid());
create policy "organizations_update_own" on public.organizations for update using (owner_user_id = auth.uid());

create policy "documents_select_own" on public.documents for select using (created_by = auth.uid());
create policy "documents_insert_own" on public.documents for insert with check (created_by = auth.uid());
create policy "documents_update_own" on public.documents for update using (created_by = auth.uid());

create policy "audit_select_own" on public.audit_events for select using (actor_user_id = auth.uid());

create policy "credits_select_own" on public.credits_ledger for select using (user_id = auth.uid());
create policy "credits_insert_own" on public.credits_ledger for insert with check (user_id = auth.uid());

-- signing_requests: server-side (service role) handles inserts/updates, keep locked down
