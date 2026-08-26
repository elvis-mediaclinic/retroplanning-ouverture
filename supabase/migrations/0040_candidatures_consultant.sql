-- Traçabilité des candidatures apportées par un consultant (lien personnalisé
-- ?c=<profile_id> sur /annonce/[id]) pour le calcul des commissions.
alter table candidatures
  add column consultant_id uuid references profiles(id) on delete set null;

create index if not exists candidatures_consultant_id_idx on candidatures(consultant_id);
