-- Hue Hideout — one-time setup for your Supabase project.
-- See README.md "Step 4" for the full click-by-click guide.
-- Paste this whole file into Supabase SQL Editor and press Run.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  chameleon_name text default 'Kiwi',
  best_score integer default 0,
  streak integer default 0,
  last_play_date date,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles are publicly readable for leaderboard"
  on public.profiles for select using (true);

create policy "profiles are inserted by their owner"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles are updated by their owner"
  on public.profiles for update using (auth.uid() = id);