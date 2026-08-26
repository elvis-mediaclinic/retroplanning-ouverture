-- Concurrents recensés sur une ville, par type (réparateur, acteur du cash,
-- revendeur…), avec un marqueur franchise/indépendant : la présence d'une
-- enseigne franchisée est un signal que le marché local est porteur.

create type public.type_concurrent as enum (
  'reparateur',
  'cash',
  'revendeur',
  'autre'
);

create table public.ville_concurrents (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.villes (id) on delete cascade,
  enseigne text not null,
  type public.type_concurrent not null default 'autre',
  franchise boolean not null default false,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index ville_concurrents_ville_id_idx on public.ville_concurrents (ville_id);

alter table public.ville_concurrents enable row level security;

create policy "ville_concurrents_mc_all" on public.ville_concurrents
  for all
  using (public.is_mc())
  with check (public.is_mc());
