-- Stocke le JSON BlockNote pour permettre la ré-édition.
-- contenu reste le HTML rendu pour l'affichage public.
alter table public.annonces
  add column if not exists contenu_json text;
