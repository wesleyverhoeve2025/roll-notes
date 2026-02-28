-- Roll Notes — Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > project > SQL Editor)

-- ── Cameras ──
create table cameras (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  prefix text not null,
  starting_number integer default 1 not null,
  current_counter integer default 0 not null,
  created_at timestamptz default now()
);

alter table cameras enable row level security;

create policy "Users can only access their own cameras"
  on cameras for all
  using (auth.uid() = user_id);

create unique index cameras_user_prefix_unique
  on cameras(user_id, upper(prefix));


-- ── Rolls ──
create table rolls (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  camera_id uuid references cameras(id) on delete cascade not null,
  roll_id text not null,
  roll_theme text,
  film_stock text,
  fresh_expired text default 'Fresh',
  expiry_month text,
  expiry_year text,
  shot_at_iso text default 'Box Speed',
  date_loaded date,
  location text,
  dev_scan text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table rolls enable row level security;

create policy "Users can only access their own rolls"
  on rolls for all
  using (auth.uid() = user_id);


-- ── Custom Film Stocks ──
create table custom_film_stocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

alter table custom_film_stocks enable row level security;

create policy "Users can only access their own custom stocks"
  on custom_film_stocks for all
  using (auth.uid() = user_id);


-- ── User Settings ──
create table user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  is_photo_club_member boolean default false,
  created_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can only access their own settings"
  on user_settings for all
  using (auth.uid() = user_id);


-- ── Auto-update updated_at on rolls ──
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rolls_updated_at
  before update on rolls
  for each row execute function update_updated_at();
