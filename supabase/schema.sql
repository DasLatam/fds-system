-- FDS System (Release 1) - Supabase SQL
-- Run in Supabase SQL Editor. Safe to re-run.

create extension if not exists "uuid-ossp";

-- Profiles (Personal/Empresa) + identity fields
create table if not exists public.profiles (
  user_id uuid primary key,
  role text not null default 'personal' check (role in ('personal','company')),
  full_name text,
  dni text,
  cuil text,
  address text,
  phone text,
  plan text not null default 'free' check (plan in ('free','personal_usd1','personal_20','company_30')),
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
  signature_path text,
  created_at timestamptz not null default now()
);

-- Audit events (append-only)
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

-- Credits ledger (usage / subscriptions - payments not included in Release 1)
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
create index if not exists audit_events_req_idx on public.audit_events(signing_request_id, created_at desc);
create index if not exists credits_ledger_user_idx on public.credits_ledger(user_id, created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.documents enable row level security;
alter table public.signing_requests enable row level security;
alter table public.audit_events enable row level security;
alter table public.credits_ledger enable row level security;

-- Helper to create policies idempotently
create or replace function public._create_policy_if_missing(
  p_name text,
  p_table regclass,
  p_cmd text,
  p_using text,
  p_check text default null
) returns void language plpgsql as $$
begin
  if not exists (
    select 1 from pg_policies where policyname = p_name and tablename = split_part(p_table::text, '.', 2)
  ) then
    execute format(
      'create policy %I on %s for %s using (%s)%s',
      p_name,
      p_table,
      p_cmd,
      p_using,
      case when p_check is null then '' else format(' with check (%s)', p_check) end
    );
  end if;
end; $$;

-- Policies
select public._create_policy_if_missing('profiles_select_own','public.profiles','select','user_id = auth.uid()');
select public._create_policy_if_missing('profiles_insert_own','public.profiles','insert','true','user_id = auth.uid()');
select public._create_policy_if_missing('profiles_update_own','public.profiles','update','user_id = auth.uid()');

select public._create_policy_if_missing('organizations_select_own','public.organizations','select','owner_user_id = auth.uid()');
select public._create_policy_if_missing('organizations_insert_own','public.organizations','insert','true','owner_user_id = auth.uid()');
select public._create_policy_if_missing('organizations_update_own','public.organizations','update','owner_user_id = auth.uid()');

select public._create_policy_if_missing('documents_select_own','public.documents','select','created_by = auth.uid()');
select public._create_policy_if_missing('documents_insert_own','public.documents','insert','true','created_by = auth.uid()');
select public._create_policy_if_missing('documents_update_own','public.documents','update','created_by = auth.uid()');

select public._create_policy_if_missing('credits_select_own','public.credits_ledger','select','user_id = auth.uid()');
select public._create_policy_if_missing('credits_insert_own','public.credits_ledger','insert','true','user_id = auth.uid()');

-- signing_requests and audit_events are mostly server-side via service role.
-- For dashboard UX we allow document owners to READ them.

select public._create_policy_if_missing(
  'signing_requests_select_owner',
  'public.signing_requests',
  'select',
  'exists (select 1 from public.documents d where d.id = signing_requests.document_id and d.created_by = auth.uid())'
);

select public._create_policy_if_missing(
  'audit_events_select_owner',
  'public.audit_events',
  'select',
  'exists (select 1 from public.documents d where d.id = audit_events.document_id and d.created_by = auth.uid())'
);
