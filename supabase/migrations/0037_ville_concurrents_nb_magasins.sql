alter table public.ville_concurrents
  add column nb_magasins int not null default 1 check (nb_magasins >= 1);
