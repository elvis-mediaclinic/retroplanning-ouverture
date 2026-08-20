-- Fonction / spécialité de la personne (indépendante du rôle de permission).
-- Exemples : "Développeur franchise", "DAF", "Marketing", "Informatique"
alter table public.profiles add column if not exists fonction text;
