-- Lie les candidats à une ville prospectée (optionnel).
alter table public.candidats
  add column if not exists ville_id uuid references public.villes (id) on delete set null;
