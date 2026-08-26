-- Partage ciblé d'une annonce avec un ou plusieurs consultants : ils ne
-- verront (sur /annonces et /opportunites) que les annonces qui leur ont
-- été explicitement partagées, plutôt que toutes les annonces publiées.
create table public.annonce_consultants (
  annonce_id uuid not null references public.annonces (id) on delete cascade,
  consultant_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (annonce_id, consultant_id)
);

create index annonce_consultants_consultant_id_idx on public.annonce_consultants (consultant_id);

alter table public.annonce_consultants enable row level security;

create policy "annonce_consultants_mc_all" on public.annonce_consultants
  for all using (public.is_mc()) with check (public.is_mc());

create policy "annonce_consultants_consultant_select" on public.annonce_consultants
  for select using (public.is_consultant() and consultant_id = auth.uid());
