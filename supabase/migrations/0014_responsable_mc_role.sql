-- Nouveau rôle pour les responsables MC (marketing, informatique, etc.)
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

-- is_mc() inclut désormais responsable_mc (lecture complète)
create or replace function public.is_mc()
returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('admin', 'consultant', 'responsable_mc') from public.profiles where id = auth.uid();
$$;

-- Les responsable_mc peuvent lire les étapes (déjà couvert par is_mc() dans la policy existante)
-- Ils ne peuvent PAS écrire (is_admin() reste la condition de write)
