-- La policy créée en 0006 était mal écrite : dans le EXISTS, "id" non qualifié
-- se résout vers annonces.id (la table du sous-select) et non villes.id (la
-- table externe), donc la condition devenait "annonces.ville_id = annonces.id"
-- — toujours fausse. Résultat : aucune ville jamais lisible par l'anon.

drop policy if exists "villes_public_select" on public.villes;

create policy "villes_public_select" on public.villes
  for select
  using (
    exists (
      select 1 from public.annonces
      where annonces.ville_id = villes.id and annonces.actif = true
    )
  );
