-- Historique des SIRET par magasin
create table public.magasin_sirets (
  id         uuid primary key default gen_random_uuid(),
  magasin_id uuid not null references public.magasins(id) on delete cascade,
  siret      text not null,
  date_debut date not null,
  date_fin   date,  -- null = SIRET actuel
  created_at timestamptz not null default now()
);

alter table public.magasin_sirets enable row level security;
create policy "sirets_mc_select"  on public.magasin_sirets for select using (public.is_mc());
create policy "sirets_admin_all"  on public.magasin_sirets for all   using (public.is_admin());

-- Migration des SIRET existants (date_debut = date_ouverture du magasin ou date arbitraire 1900-01-01)
insert into public.magasin_sirets (magasin_id, siret, date_debut)
select id, siret, coalesce(date_ouverture, '1900-01-01'::date)
from public.magasins
where siret is not null and siret <> '';

-- Suppression de la colonne siret de magasins
alter table public.magasins drop column siret;

-- Historique des cessions
create table public.magasin_cessions (
  id                    uuid primary key default gen_random_uuid(),
  magasin_id            uuid not null references public.magasins(id) on delete cascade,
  date_cession          date not null,
  type_cession          text not null check (type_cession in ('franchise_a_franchise', 'integre_a_franchise', 'franchise_a_integre')),
  franchise_cedant_id   uuid references public.franchises(id) on delete set null,
  franchise_repreneur_id uuid references public.franchises(id) on delete set null,
  nouveau_siret         text,  -- SIRET du repreneur si connu
  notes                 text,
  created_at            timestamptz not null default now()
);

alter table public.magasin_cessions enable row level security;
create policy "cessions_mc_select" on public.magasin_cessions for select using (public.is_mc());
create policy "cessions_admin_all" on public.magasin_cessions for all   using (public.is_admin());
