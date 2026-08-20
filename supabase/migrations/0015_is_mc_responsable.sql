-- is_mc() inclut désormais responsable_mc.
-- Doit être dans une transaction séparée car 'responsable_mc' a été ajouté
-- à l'enum dans la migration 0014 (nouvelle valeur d'enum = commit requis avant usage).
create or replace function public.is_mc()
returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('admin', 'consultant', 'responsable_mc') from public.profiles where id = auth.uid();
$$;
