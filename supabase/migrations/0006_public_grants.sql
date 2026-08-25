-- Accès public pour les pages d'annonces (utilisateur anon non authentifié).
-- Sans ces policies, la jointure villes(id, nom) dans /annonce/[id] échoue
-- et retourne null → notFound() → 404.

-- Permet à l'anon de lire le nom des villes associées à une annonce active.
create policy "villes_public_select" on public.villes
  for select
  using (
    exists (
      select 1 from public.annonces
      where annonces.ville_id = villes.id and annonces.actif = true
    )
  );
