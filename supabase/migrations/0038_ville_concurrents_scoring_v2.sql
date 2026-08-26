-- Refonte de la taxonomie des concurrents pour le calcul du score de
-- saturation : le type porte désormais lui-même la distinction
-- réseau/indépendant pour les réparateurs, et distingue les acteurs du
-- cash selon qu'ils proposent ou non un service de réparation. Ajoute
-- aussi la distance au site visé, utilisée pour pondérer chaque
-- concurrent selon sa proximité réelle.

create type public.type_concurrent_v2 as enum (
  'reparateur_reseau',
  'reparateur_independant',
  'cash_avec_reparation',
  'cash_generaliste',
  'destockage'
);

alter table public.ville_concurrents add column type_v2 public.type_concurrent_v2;

update public.ville_concurrents set type_v2 = case
  when type = 'reparateur' and franchise then 'reparateur_reseau'::public.type_concurrent_v2
  when type = 'reparateur' and not franchise then 'reparateur_independant'::public.type_concurrent_v2
  when type = 'cash' then 'cash_generaliste'::public.type_concurrent_v2
  else 'destockage'::public.type_concurrent_v2
end;

alter table public.ville_concurrents alter column type_v2 set not null;
alter table public.ville_concurrents drop column type;
alter table public.ville_concurrents rename column type_v2 to type;

drop type public.type_concurrent;
alter type public.type_concurrent_v2 rename to type_concurrent;

-- Temps de trajet voiture (minutes) depuis le site visé jusqu'au concurrent.
-- Défaut à 10 (tranche "proche mais pas immédiate") pour les lignes existantes.
alter table public.ville_concurrents
  add column distance_minutes int not null default 10 check (distance_minutes >= 0);

comment on column public.ville_concurrents.distance_minutes is
  'Temps de trajet voiture depuis le site visé. Pour comparer les villes entre elles, la population de la zone de chalandise (villes.zone_chalandise) devrait idéalement être calculée sur une isochrone 15-20 min voiture autour du site, pas sur un périmètre administratif (ville/agglo/arrondissement) — des périmètres hétérogènes faussent la comparaison du score de saturation entre villes.';
