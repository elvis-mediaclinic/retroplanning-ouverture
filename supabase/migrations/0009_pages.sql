create table public.pages (
  key text primary key,
  sections jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "pages_mc_all" on public.pages
  for all using (public.is_mc()) with check (public.is_mc());

create policy "pages_public_select" on public.pages
  for select using (true);
