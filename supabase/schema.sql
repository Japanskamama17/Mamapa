-- Bebi Karta Zagreb — database setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

-- ---------- Tables ----------
create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  address     text default '' check (char_length(address) <= 200),
  district    text default '' check (char_length(district) <= 80),
  lat         double precision not null check (lat between 45.6 and 46.0),
  lng         double precision not null check (lng between 15.7 and 16.3),
  gmaps_url   text default '' check (char_length(gmaps_url) <= 600),
  categories  text[] not null default '{}',
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places(id) on delete cascade,
  rating      smallint check (rating between 1 and 5),
  body        text default '' check (char_length(body) <= 1000),
  photos      text[] not null default '{}',
  author_name text default '' check (char_length(author_name) <= 60),
  created_by  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists reviews_place_idx on public.reviews(place_id);

-- Only the known category ids are allowed
alter table public.places drop constraint if exists places_categories_check;
alter table public.places add constraint places_categories_check
  check (categories <@ array['changing','playarea','playground','nosmoke','nursing','stroller']::text[]
         and cardinality(categories) >= 1);

-- ---------- Row Level Security ----------
alter table public.places  enable row level security;
alter table public.reviews enable row level security;

-- Everyone (even without login) can read
drop policy if exists "places readable"  on public.places;
drop policy if exists "reviews readable" on public.reviews;
create policy "places readable"  on public.places  for select using (true);
create policy "reviews readable" on public.reviews for select using (true);

-- Logged-in people can add; only the author can edit or delete their own rows
drop policy if exists "places insert own" on public.places;
drop policy if exists "places update own" on public.places;
drop policy if exists "places delete own" on public.places;
create policy "places insert own" on public.places for insert to authenticated with check (created_by = auth.uid());
create policy "places update own" on public.places for update to authenticated using (created_by = auth.uid());
create policy "places delete own" on public.places for delete to authenticated using (created_by = auth.uid());

drop policy if exists "reviews insert own" on public.reviews;
drop policy if exists "reviews update own" on public.reviews;
drop policy if exists "reviews delete own" on public.reviews;
create policy "reviews insert own" on public.reviews for insert to authenticated with check (created_by = auth.uid());
create policy "reviews update own" on public.reviews for update to authenticated using (created_by = auth.uid());
create policy "reviews delete own" on public.reviews for delete to authenticated using (created_by = auth.uid());

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos upload own folder" on storage.objects;
drop policy if exists "photos delete own"        on storage.objects;
create policy "photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and owner = auth.uid());

-- ---------- Live updates (new places appear without reloading) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.places;  exception when others then null; end;
  begin alter publication supabase_realtime add table public.reviews; exception when others then null; end;
end $$;
