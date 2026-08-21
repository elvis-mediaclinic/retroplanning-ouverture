-- Table franchisés : entité indépendante, peut avoir plusieurs magasins
create table public.franchises (
  id uuid primary key default gen_random_uuid(),
  nom text not null, -- Nom du groupe ou du franchisé principal
  associes jsonb not null default '[]', -- [{prenom, nom, telephone, email}]
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.franchises enable row level security;

create policy "franchises_mc_select" on public.franchises
  for select using (public.is_mc());

create policy "franchises_admin_all" on public.franchises
  for all using (public.is_admin());

-- Remplace le jsonb franchises dans magasins par un lien vers la table franchises
alter table public.magasins
  add column franchise_id uuid references public.franchises (id) on delete set null,
  drop column if exists franchises;
