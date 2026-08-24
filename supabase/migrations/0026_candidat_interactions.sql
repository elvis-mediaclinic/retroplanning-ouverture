create type public.type_interaction as enum (
  'appel',
  'email',
  'visio',
  'visite_siege',
  'autre'
);

create type public.statut_interaction as enum (
  'planifie',
  'fait',
  'annule'
);

create table public.candidat_interactions (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid not null references public.candidats (id) on delete cascade,
  type public.type_interaction not null,
  statut public.statut_interaction not null default 'planifie',
  date_prevue timestamptz,
  date_realisee timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.candidat_interactions enable row level security;

create policy "candidat_interactions_mc_select" on public.candidat_interactions
  for select using (public.is_mc());

create policy "candidat_interactions_mc_all" on public.candidat_interactions
  for all using (public.is_mc());
