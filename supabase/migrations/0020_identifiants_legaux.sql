-- Identifiants légaux du magasin
alter table public.magasins
  add column siret text;

-- Informations société du franchisé
alter table public.franchises
  add column raison_sociale text,
  add column siren text,
  add column rcs text,
  add column tva_intracom text;
