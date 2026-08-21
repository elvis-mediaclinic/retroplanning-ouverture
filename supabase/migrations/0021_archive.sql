-- Archivage des magasins fermés et des franchisés inactifs
alter table public.magasins
  add column archive boolean not null default false,
  add column date_fermeture date;

alter table public.franchises
  add column archive boolean not null default false;
