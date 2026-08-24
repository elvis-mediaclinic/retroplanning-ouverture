alter table public.villes add column if not exists zone_chalandise text;
alter table public.villes drop column if exists population;
alter table public.villes drop column if exists code_postal;
