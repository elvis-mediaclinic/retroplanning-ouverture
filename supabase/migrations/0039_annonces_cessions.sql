-- Annonces de cession : une annonce publique peut désormais porter soit sur
-- l'ouverture d'une nouvelle ville (ville_id, comme avant), soit sur la
-- cession d'un magasin déjà ouvert (magasin_id) — jamais les deux.

alter table public.annonces alter column ville_id drop not null;

alter table public.annonces
  add column magasin_id uuid references public.magasins (id) on delete cascade;

alter table public.annonces
  add column type_annonce text not null default 'ouverture'
    check (type_annonce in ('ouverture', 'cession'));

alter table public.annonces
  add constraint annonces_target_check check (
    (ville_id is not null and magasin_id is null)
    or (ville_id is null and magasin_id is not null)
  );

create index annonces_magasin_id_idx on public.annonces (magasin_id);

-- Une candidature sur une annonce de cession se rattache au magasin visé,
-- pas à une ville.
alter table public.candidatures
  add column magasin_id uuid references public.magasins (id) on delete set null;

-- Pas de policy RLS publique ajoutée sur "magasins" : les colonnes publiques
-- d'un magasin visé par une annonce de cession sont exposées via le client de
-- service avec une sélection de colonnes explicite côté serveur (même
-- pattern que /nos-magasins), pour ne jamais exposer telephone/email/notes/
-- siret à une requête anonyme qui les demanderait directement.
