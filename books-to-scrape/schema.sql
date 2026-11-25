-- Table for the scraped books
create table if not exists public.books (
  id          bigint generated always as identity primary key,
  title       text      not null,
  price       numeric(6, 2) not null,
  rating      smallint  not null check (rating between 1 and 5),
  in_stock    boolean   not null,
  url         text      not null unique,
  created_at  timestamptz not null default now()
);

-- Security: turn on Row Level Security (RLS)
alter table public.books enable row level security;

-- Explicit permissions: first remove any default access, then grant only what is needed
revoke all on table public.books from anon, authenticated, service_role;
-- the public (publishable key, "anon") may only READ
grant select on table public.books to anon;
-- the scraper (secret key, "service_role") may read, add and update rows (needed for upsert)
grant select, insert, update on table public.books to service_role;

-- Row Level Security policy: the public may read every row
-- (drop first so this script can be run again safely)
drop policy if exists "Anyone can read books" on public.books;
create policy "Anyone can read books"
  on public.books
  for select
  to anon
  using (true);

-- No insert/update/delete for anon, and no delete for anyone through the API.
-- The secret key (service_role) bypasses RLS, so the scraper can write.
