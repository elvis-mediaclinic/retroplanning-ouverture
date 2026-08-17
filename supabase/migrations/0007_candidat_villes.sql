-- Relation many-to-many candidats ↔ villes.
-- Un candidat peut être intéressé par plusieurs villes.

create table public.candidat_villes (
  candidat_id uuid not null references public.candidats (id) on delete cascade,
  ville_id    uuid not null references public.villes (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (candidat_id, ville_id)
);

alter table public.candidat_villes enable row level security;

create policy "candidat_villes_mc_all" on public.candidat_villes
  for all using (public.is_mc()) with check (public.is_mc());
