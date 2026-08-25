alter table public.annonces add column if not exists hero_carte boolean not null default true;
alter table public.annonces add column if not exists hero_titre_centre boolean not null default false;
alter table public.annonces add column if not exists hero_accroche_centre boolean not null default false;
