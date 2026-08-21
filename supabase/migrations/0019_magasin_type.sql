-- Distingue les magasins intégrés (appartenant à la marque) des magasins franchisés
alter table public.magasins
  add column type text not null default 'franchise'
  check (type in ('integre', 'franchise'));
