-- Enable UUIDs
create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  qr_code text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by the owner" on public.profiles
for select using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin=true));

create policy "profiles can be upserted by owner" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles can be updated by owner" on public.profiles
for update using (auth.uid() = id);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  facility_id text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  project_name text,
  project_updates text,
  studio_equipment text[],
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Prevent double booking: each facility+start_time must be unique
create unique index if not exists uniq_facility_start on public.bookings (facility_id, start_time);

-- RLS: users manage their own bookings; admins can read all
create policy "users can select own bookings" on public.bookings
for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin=true));

create policy "users can insert their bookings" on public.bookings
for insert with check (auth.uid() = user_id);

create policy "users can update own bookings" on public.bookings
for update using (auth.uid() = user_id);

create policy "users can delete own bookings" on public.bookings
for delete using (auth.uid() = user_id);

-- Projects (simple)
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  updates text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
create policy "projects readable by owner" on public.projects
for select using (auth.uid() = user_id);
create policy "projects insert by owner" on public.projects
for insert with check (auth.uid() = user_id);
create policy "projects update by owner" on public.projects
for update using (auth.uid() = user_id);
create policy "projects delete by owner" on public.projects
for delete using (auth.uid() = user_id);
-- Profiles: WhatsApp linking + phone
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists wa_link_code text;
alter table public.profiles add column if not exists wa_link_code_expires timestamptz;

create index if not exists idx_profiles_wa_code on public.profiles(wa_link_code);

-- RLS: allow user to update their own phone/link fields (if you don't already have a generic "update own profile" policy)
drop policy if exists "update own profile (phone/link)" on public.profiles;
create policy "update own profile (phone/link)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
