-- Fondations : rôles, profils, villes, candidats, projets, retroplanning.
-- À exécuter dans le SQL editor du projet Supabase.

-- ---------------------------------------------------------------------------
-- Nettoyage préalable (idempotent — sans risque si la base est vide)
-- ---------------------------------------------------------------------------

drop table if exists public.commentaires cascade;
drop table if exists public.etapes_projet cascade;
drop table if exists public.etapes_template cascade;
drop table if exists public.projets cascade;
drop table if exists public.candidats cascade;
drop table if exists public.villes cascade;
drop table if exists public.profiles cascade;

drop type if exists public.phase_etape cascade;
drop type if exists public.responsable_etape cascade;
drop type if exists public.statut_etape cascade;
drop type if exists public.statut_projet cascade;
drop type if exists public.statut_candidat cascade;
drop type if exists public.statut_ville cascade;
drop type if exists public.format_magasin cascade;
drop type if exists public.type_magasin cascade;
drop type if exists public.user_role cascade;

drop function if exists public.get_role cascade;
drop function if exists public.is_admin cascade;
drop function if exists public.is_mc cascade;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'consultant', 'franchise');

create type public.type_magasin as enum ('integre', 'franchise');

create type public.format_magasin as enum (
  'classique',
  'galerie',
  'centre_ville',
  'kiosque',
  'shop_in_shop'
);

create type public.statut_ville as enum ('en_etude', 'validee', 'abandonnee');

create type public.statut_candidat as enum (
  'prospect',
  'en_evaluation',
  'valide',
  'signe',
  'refuse'
);

create type public.statut_projet as enum (
  'prospection',
  'en_cours',
  'ouvert',
  'suspendu',
  'abandonne'
);

create type public.statut_etape as enum ('a_faire', 'en_cours', 'fait', 'en_retard', 'na');

create type public.responsable_etape as enum ('franchise', 'mc', 'externe');

create type public.phase_etape as enum (
  'administratif_financement',
  'communication',
  'ressources_humaines',
  'travaux_amenagement',
  'formation',
  'stock_fournisseurs',
  'ouverture'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Étend auth.users : un profil = un compte applicatif avec un rôle.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'franchise',
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  created_at timestamptz not null default now()
);

-- Villes prospectées (indépendant des projets : une ville peut avoir N projets).
create table public.villes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  departement text,
  region text,
  population int,
  statut public.statut_ville not null default 'en_etude',
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Candidats franchisés (indépendant des projets, peuvent en avoir N).
create table public.candidats (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  email text not null,
  telephone text,
  apport_personnel numeric,
  zone_souhaitee text,
  statut public.statut_candidat not null default 'prospect',
  notes text,
  -- Null jusqu'à l'invitation Supabase ; renseigné quand le candidat devient utilisateur.
  profil_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Projets d'ouverture : ville + candidat/franchisé + format.
-- ville_id et candidat_id sont tous les deux nullables : un projet peut démarrer
-- avec seulement l'un des deux (prospection ville ou candidat trouvé en premier).
create table public.projets (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type_magasin public.type_magasin not null,
  format_magasin public.format_magasin not null,
  statut public.statut_projet not null default 'prospection',
  ville_id uuid references public.villes (id) on delete set null,
  candidat_id uuid references public.candidats (id) on delete set null,
  -- Renseigné quand le candidat est invité et dispose d'un compte.
  franchisee_id uuid references public.profiles (id) on delete set null,
  date_cible_ouverture date,
  date_ouverture_reelle date,
  surface_m2 int,
  lien_sharepoint text,
  notes text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Template des 33 tâches standard (cf. migration 0002).
create table public.etapes_template (
  id uuid primary key default gen_random_uuid(),
  phase public.phase_etape not null,
  nom text not null,
  description text,
  ordre int not null,
  -- Semaines avant l'ouverture (ex: -12 = 12 semaines avant). Null = "à définir".
  delai_semaines int,
  responsable public.responsable_etape not null default 'franchise',
  created_at timestamptz not null default now()
);

-- Étapes par projet, générées depuis le template à la création du projet.
-- Peuvent être personnalisées (ajout/suppression/modification d'une étape).
create table public.etapes_projet (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  template_id uuid references public.etapes_template (id) on delete set null,
  phase public.phase_etape not null,
  nom text not null,
  responsable public.responsable_etape not null,
  ordre int not null,
  statut public.statut_etape not null default 'a_faire',
  -- Calculée depuis date_cible_ouverture + delai_semaines lors de la génération.
  -- Peut être ajustée manuellement ensuite.
  date_cible date,
  date_realisation date,
  lien_document text,
  commentaire text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Journal de commentaires par projet ou par étape.
create table public.commentaires (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  etape_id uuid references public.etapes_projet (id) on delete cascade,
  auteur_id uuid not null references public.profiles (id) on delete cascade,
  contenu text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires (security definer pour éviter la récursion RLS)
-- ---------------------------------------------------------------------------

create function public.get_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

-- Retourne true pour admin ET consultant (équipe MC interne).
create function public.is_mc()
returns boolean
language sql stable security definer set search_path = public as $$
  select role in ('admin', 'consultant') from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.villes enable row level security;
alter table public.candidats enable row level security;
alter table public.projets enable row level security;
alter table public.etapes_template enable row level security;
alter table public.etapes_projet enable row level security;
alter table public.commentaires enable row level security;

-- profiles
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_mc_select" on public.profiles
  for select using (public.is_mc());

-- villes : équipe MC uniquement (franchise n'y a pas accès)
create policy "villes_mc_all" on public.villes
  for all using (public.is_mc()) with check (public.is_mc());

-- candidats : équipe MC uniquement
create policy "candidats_mc_all" on public.candidats
  for all using (public.is_mc()) with check (public.is_mc());

-- projets : MC voit tout ; franchise voit uniquement les siens
create policy "projets_mc_all" on public.projets
  for all using (public.is_mc()) with check (public.is_mc());

create policy "projets_franchise_select" on public.projets
  for select using (franchisee_id = auth.uid());

-- etapes_template : MC gère, franchise lit
create policy "etapes_template_mc_all" on public.etapes_template
  for all using (public.is_mc()) with check (public.is_mc());

create policy "etapes_template_franchise_select" on public.etapes_template
  for select using (auth.uid() is not null);

-- etapes_projet : MC voit tout ; franchise voit/modifie ses étapes
create policy "etapes_projet_mc_all" on public.etapes_projet
  for all using (
    public.is_mc() or
    projet_id in (select id from public.projets where franchisee_id = auth.uid())
  ) with check (public.is_mc());

-- Le franchisé peut mettre à jour le statut, commentaire, date_realisation et lien_document
-- sur les étapes de ses propres projets.
create policy "etapes_projet_franchise_update" on public.etapes_projet
  for update
  using (projet_id in (select id from public.projets where franchisee_id = auth.uid()))
  with check (projet_id in (select id from public.projets where franchisee_id = auth.uid()));

-- commentaires : MC voit tout ; franchise voit/crée sur ses projets
create policy "commentaires_mc_all" on public.commentaires
  for all using (public.is_mc()) with check (public.is_mc());

create policy "commentaires_franchise_select" on public.commentaires
  for select using (
    projet_id in (select id from public.projets where franchisee_id = auth.uid())
  );

create policy "commentaires_franchise_insert" on public.commentaires
  for insert with check (
    auteur_id = auth.uid() and
    projet_id in (select id from public.projets where franchisee_id = auth.uid())
  );
