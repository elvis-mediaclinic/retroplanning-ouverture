-- Une candidature peut être portée par plusieurs personnes (associés),
-- aucune n'étant prioritaire sur les autres. Le candidat principal reste
-- représenté par les colonnes existantes de "candidats" ; chaque associé
-- supplémentaire est une ligne de cette table.

create table public.candidat_associes (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid not null references public.candidats (id) on delete cascade,
  prenom text not null,
  nom text not null,
  email text,
  telephone text,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);

create index candidat_associes_candidat_id_idx on public.candidat_associes (candidat_id);

alter table public.candidat_associes enable row level security;

create policy "candidat_associes_mc_all" on public.candidat_associes
  for all
  using (public.is_mc())
  with check (public.is_mc());
