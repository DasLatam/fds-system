-- FDS System (MVP) - Supabase SQL
-- Creates tables, indexes and enables RLS. Storage bucket policies are described in README.

create extension if not exists "uuid-ossp";

create table if not exists public.documents (
  id uuid primary key,
  created_by uuid not null,
  title text not null,
  status text not null default 'pending' check (status in ('pending','signed')),
  original_path text not null,
  final_path text,
  original_hash text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.signing_requests (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  email text not null,
  token uuid not null unique,
  status text not null default 'pending' check (status in ('pending','signed')),
  signed_at timestamp with time zone,
  signer_ip text,
  signature_hash text,
  created_at timestamp with time zone not null default now()
);

create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists signing_requests_document_id_idx on public.signing_requests(document_id);
create index if not exists signing_requests_token_idx on public.signing_requests(token);

alter table public.documents enable row level security;
alter table public.signing_requests enable row level security;

-- Documents: users see/manage only their docs
create policy if not exists "documents_select_own"
on public.documents for select
using (created_by = auth.uid());

create policy if not exists "documents_insert_own"
on public.documents for insert
with check (created_by = auth.uid());

create policy if not exists "documents_update_own"
on public.documents for update
using (created_by = auth.uid());

-- Signing requests are handled by server-side routes using service_role.
-- Keep RLS restrictive (no public access). If you later want firmantes autenticados,
-- add policies based on auth.uid() or a join with a firmante user.
