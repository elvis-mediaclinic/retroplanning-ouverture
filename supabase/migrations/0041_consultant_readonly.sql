-- Redéfinit le rôle "consultant" en lecture seule et scopée :
-- - villes (+ concurrents) : lecture complète
-- - candidats : uniquement ceux apportés par ce consultant (via candidatures.consultant_id)
-- - projets (ouvertures) : uniquement les siens, juste la progression (pas le détail des étapes)
-- - annonces publiées : déjà accessible via la policy publique existante
--
-- is_mc() ne couvre donc plus "consultant" : ça retire d'un coup l'accès en
-- écriture (et la lecture large) que le consultant avait sur toutes les
-- tables "*_mc_all" (villes, candidats, projets, etapes_*, commentaires,
-- pages, annonces, candidatures, magasins, franchises, etc.).
create or replace function public.is_mc()
returns boolean
language sql
security definer
set search_path = public
as $$
  select role in ('admin', 'responsable_mc') from public.profiles where id = auth.uid();
$$;

create or replace function public.is_consultant()
returns boolean
language sql
security definer
set search_path = public
as $$
  select role = 'consultant' from public.profiles where id = auth.uid();
$$;

-- Villes : lecture complète (y compris le panneau concurrents)
create policy "villes_consultant_select" on public.villes
  for select using (public.is_consultant());

create policy "ville_concurrents_consultant_select" on public.ville_concurrents
  for select using (public.is_consultant());

-- Candidatures (soumissions de formulaire) : uniquement celles apportées par ce consultant
create policy "candidatures_consultant_select" on public.candidatures
  for select using (public.is_consultant() and consultant_id = auth.uid());

-- Candidats (fiches CRM) : uniquement ceux liés à une candidature apportée par ce consultant
create policy "candidats_consultant_select" on public.candidats
  for select using (
    public.is_consultant() and exists (
      select 1 from public.candidatures cd
      where cd.consultant_id = auth.uid() and lower(cd.email) = lower(candidats.email)
    )
  );

create policy "candidat_villes_consultant_select" on public.candidat_villes
  for select using (
    public.is_consultant() and exists (
      select 1 from public.candidats c
      join public.candidatures cd on lower(cd.email) = lower(c.email)
      where c.id = candidat_villes.candidat_id and cd.consultant_id = auth.uid()
    )
  );

create policy "candidat_interactions_consultant_select" on public.candidat_interactions
  for select using (
    public.is_consultant() and exists (
      select 1 from public.candidats c
      join public.candidatures cd on lower(cd.email) = lower(c.email)
      where c.id = candidat_interactions.candidat_id and cd.consultant_id = auth.uid()
    )
  );

create policy "candidat_associes_consultant_select" on public.candidat_associes
  for select using (
    public.is_consultant() and exists (
      select 1 from public.candidats c
      join public.candidatures cd on lower(cd.email) = lower(c.email)
      where c.id = candidat_associes.candidat_id and cd.consultant_id = auth.uid()
    )
  );

-- Projets : uniquement ceux dont le candidat vient de ce consultant.
-- Le détail du retroplanning (etapes_projet/etapes_template/commentaires)
-- reste inaccessible — aucune policy consultant ajoutée dessus, donc refusé
-- par défaut. On expose juste un % de progression pré-calculé sur "projets".
create policy "projets_consultant_select" on public.projets
  for select using (
    public.is_consultant() and candidat_id is not null and exists (
      select 1 from public.candidats c
      join public.candidatures cd on lower(cd.email) = lower(c.email)
      where c.id = projets.candidat_id and cd.consultant_id = auth.uid()
    )
  );

alter table public.projets add column progression_pct int not null default 0;

create or replace function public.update_projet_progression()
returns trigger
language plpgsql
as $$
declare
  target_projet_id uuid;
  total int;
  faites int;
begin
  target_projet_id := coalesce(new.projet_id, old.projet_id);
  select count(*), count(*) filter (where statut in ('fait', 'na'))
    into total, faites
    from public.etapes_projet where projet_id = target_projet_id;
  update public.projets
    set progression_pct = case when total > 0 then round(faites::numeric / total * 100) else 0 end
    where id = target_projet_id;
  return null;
end;
$$;

create trigger etapes_projet_progression_trigger
  after insert or update or delete on public.etapes_projet
  for each row execute function public.update_projet_progression();

-- Backfill des projets existants
update public.projets p
set progression_pct = coalesce((
  select case when count(*) > 0
    then round(count(*) filter (where e.statut in ('fait', 'na'))::numeric / count(*) * 100)
    else 0
  end
  from public.etapes_projet e where e.projet_id = p.id
), 0);
