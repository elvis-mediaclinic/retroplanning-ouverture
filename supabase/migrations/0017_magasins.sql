create table public.magasins (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  -- Associés / franchisés : tableau JSON [{prenom, nom, telephone, email}]
  franchises jsonb not null default '[]',
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  date_signature_contrat date,
  date_ouverture date,
  format public.format_magasin,
  surface_m2 int,
  notes text,
  -- Lien optionnel vers le projet d'ouverture d'origine
  projet_id uuid references public.projets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.magasins enable row level security;

-- Seuls les MC (admin, consultant, responsable_mc) peuvent lire
create policy "magasins_mc_select" on public.magasins
  for select using (public.is_mc());

-- Seul l'admin peut créer / modifier / supprimer
create policy "magasins_admin_all" on public.magasins
  for all using (public.is_admin());
