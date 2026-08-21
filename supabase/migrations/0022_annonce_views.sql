-- Table de suivi des vues d'annonces (cookie anonyme, pas d'IP)
create table public.annonce_views (
  id          uuid primary key default gen_random_uuid(),
  annonce_id  uuid not null references public.annonces(id) on delete cascade,
  visitor_id  text not null,        -- UUID aléatoire stocké dans cookie, aucune donnée personnelle
  viewed_date date not null default current_date,  -- date UTC, pas de timezone — IMMUTABLE-safe
  viewed_at   timestamptz not null default now()
);

-- Une seule vue comptée par visiteur et par annonce par jour calendaire
create unique index annonce_views_daily_uniq
  on public.annonce_views (annonce_id, visitor_id, viewed_date);

-- RLS : inserts via server action uniquement (service role), lecture réservée aux MC
alter table public.annonce_views enable row level security;

create policy "MC peut lire les vues"
  on public.annonce_views for select
  to authenticated
  using (is_mc());
