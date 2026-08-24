alter table public.candidat_interactions drop column if exists statut;
alter table public.candidat_interactions drop column if exists date_prevue;
alter table public.candidat_interactions alter column date_realisee set default now();
update public.candidat_interactions set date_realisee = created_at where date_realisee is null;
alter table public.candidat_interactions alter column date_realisee set not null;

drop type if exists public.statut_interaction;
