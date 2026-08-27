-- Lien candidat ↔ magasin en cession : équivalent de candidat_villes pour
-- les opportunités de reprise (annonces de type "cession"), sélectionnables
-- aux côtés des villes dans la fiche candidat.
create table public.candidat_magasins (
  candidat_id uuid not null references public.candidats (id) on delete cascade,
  magasin_id  uuid not null references public.magasins (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (candidat_id, magasin_id)
);

alter table public.candidat_magasins enable row level security;

create policy "candidat_magasins_mc_all" on public.candidat_magasins
  for all using (public.is_mc()) with check (public.is_mc());

-- Lecture scopée pour le consultant, alignée sur candidat_villes_consultant_select
create policy "candidat_magasins_consultant_select" on public.candidat_magasins
  for select using (
    public.is_consultant() and exists (
      select 1 from public.candidats c
      join public.candidatures cd on lower(cd.email) = lower(c.email)
      where c.id = candidat_magasins.candidat_id and cd.consultant_id = auth.uid()
    )
  );
