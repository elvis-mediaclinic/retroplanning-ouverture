-- Nouveau rôle pour les responsables MC (marketing, informatique, etc.)
-- NOTE : l'enum doit être commitée AVANT d'être utilisée dans une fonction.
-- La mise à jour de is_mc() est dans la migration 0015.
alter type public.user_role add value if not exists 'responsable_mc';

-- resp_mc passe de text[] (étiquettes) à uuid[] (IDs de profils)
-- Les données existantes sont perdues (c'étaient des étiquettes, pas des IDs valides)
alter table public.etapes_projet
  drop column resp_mc;
alter table public.etapes_projet
  add column resp_mc uuid[] default null;

alter table public.etapes_template
  drop column resp_mc;
alter table public.etapes_template
  add column resp_mc uuid[] default null;
