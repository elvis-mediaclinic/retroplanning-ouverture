-- Bibliothèque de pictogrammes SVG réutilisables dans les sections
-- (annonces, concept) : évite de ressaisir/re-coller le code SVG à chaque
-- nouvelle section.
create table public.svg_icons (
  id uuid primary key default gen_random_uuid(),
  svg text not null unique,
  label text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.svg_icons enable row level security;

create policy "svg_icons_mc_all" on public.svg_icons
  for all using (public.is_mc()) with check (public.is_mc());
