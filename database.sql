create table public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default '',
  slug text not null,
  name text not null,
  origin_name text,
  thumb text,
  poster text,
  episode_name text,
  episode_index integer not null default 0,
  server_index integer not null default 0,
  progress_seconds integer not null default 0,
  duration_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, source, slug)
);

alter table public.watch_history
  add column if not exists progress_seconds integer not null default 0,
  add column if not exists duration_seconds integer not null default 0;

alter table public.watch_history enable row level security;

create policy "Users can read own watch history"
on public.watch_history for select
using (auth.uid() = user_id);

create policy "Users can insert own watch history"
on public.watch_history for insert
with check (auth.uid() = user_id);

create policy "Users can update own watch history"
on public.watch_history for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own watch history"
on public.watch_history for delete
using (auth.uid() = user_id);

create table public.favorite_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default '',
  slug text not null,
  name text not null,
  origin_name text,
  thumb text,
  poster text,
  updated_at timestamptz not null default now(),
  unique (user_id, source, slug)
);

alter table public.favorite_movies enable row level security;

create policy "Users can read own favorite movies"
on public.favorite_movies for select
using (auth.uid() = user_id);

create policy "Users can insert own favorite movies"
on public.favorite_movies for insert
with check (auth.uid() = user_id);

create policy "Users can update own favorite movies"
on public.favorite_movies for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own favorite movies"
on public.favorite_movies for delete
using (auth.uid() = user_id);

create table public.watch_later_movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default '',
  slug text not null,
  name text not null,
  origin_name text,
  thumb text,
  poster text,
  updated_at timestamptz not null default now(),
  unique (user_id, source, slug)
);

alter table public.watch_later_movies enable row level security;

create policy "Users can read own watch later movies"
on public.watch_later_movies for select
using (auth.uid() = user_id);

create policy "Users can insert own watch later movies"
on public.watch_later_movies for insert
with check (auth.uid() = user_id);

create policy "Users can update own watch later movies"
on public.watch_later_movies for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own watch later movies"
on public.watch_later_movies for delete
using (auth.uid() = user_id);
