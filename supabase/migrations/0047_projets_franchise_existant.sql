-- Permet de rattacher une ouverture à un franchisé déjà en place (qui ouvre
-- un magasin supplémentaire) plutôt qu'à un candidat issu de la prospection.
alter table public.projets
  add column franchise_id uuid references public.franchises (id) on delete set null;
