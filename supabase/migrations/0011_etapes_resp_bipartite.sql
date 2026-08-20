-- Responsables bipartites : un côté MC, un côté franchisé
alter table public.etapes_projet
  add column if not exists resp_mc text,
  add column if not exists resp_franchise text;

alter table public.etapes_templates
  add column if not exists resp_mc text,
  add column if not exists resp_franchise text;
