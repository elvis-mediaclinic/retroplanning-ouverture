-- Reprend dans la bibliothèque tous les SVG déjà saisis dans les sections
-- existantes (annonces + concept), pour ne pas repartir d'une bibliothèque
-- vide.
insert into public.svg_icons (svg)
select distinct icone
from (
  select (elem ->> 'icone') as icone
  from public.annonces, jsonb_array_elements(coalesce(sections, '[]'::jsonb)) as elem
  where elem ->> 'icone' is not null and elem ->> 'icone' <> ''

  union all

  select (elem ->> 'icone') as icone
  from public.pages, jsonb_array_elements(coalesce(sections, '[]'::jsonb)) as elem
  where elem ->> 'icone' is not null and elem ->> 'icone' <> ''
) t
on conflict (svg) do nothing;
