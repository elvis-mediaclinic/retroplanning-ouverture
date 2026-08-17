-- Annonces publiques par ville + candidatures reçues.

create table public.annonces (
  id uuid primary key default gen_random_uuid(),
  ville_id uuid not null references public.villes (id) on delete cascade,
  titre text not null,
  accroche text,
  contenu text,
  actif boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidatures (
  id uuid primary key default gen_random_uuid(),
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  ville_id uuid references public.villes (id) on delete set null,
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  apport_personnel numeric,
  message text,
  traite boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS annonces
alter table public.annonces enable row level security;

-- MC : gestion complète
create policy "annonces_mc_all" on public.annonces
  for all using (public.is_mc()) with check (public.is_mc());

-- Public (anon) : lecture des annonces actives uniquement
create policy "annonces_public_select" on public.annonces
  for select using (actif = true);

-- RLS candidatures
alter table public.candidatures enable row level security;

-- MC : lecture complète
create policy "candidatures_mc_all" on public.candidatures
  for all using (public.is_mc()) with check (public.is_mc());

-- Public (anon) : insertion uniquement
create policy "candidatures_public_insert" on public.candidatures
  for insert with check (true);
