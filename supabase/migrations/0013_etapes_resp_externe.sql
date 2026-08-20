alter table public.etapes_projet
  add column if not exists resp_externe text;

alter table public.etapes_template
  add column if not exists resp_externe text;
