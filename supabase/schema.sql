-- CheckMyRep Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- ══════════════════════════════════════════════
-- PROFILES (extends Supabase auth.users)
-- ══════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  address_line1 text,
  address_city text,
  address_state text,
  address_zip text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Service role full access on profiles" on public.profiles for all to service_role using (true) with check (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════
-- SAVED REPS (synced from localStorage)
-- ══════════════════════════════════════════════
create table if not exists public.saved_reps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  rep_id text not null,
  rep_name text not null,
  rep_data jsonb, -- full Representative object for offline access
  created_at timestamptz default now(),
  unique(user_id, rep_id)
);

alter table public.saved_reps enable row level security;
create policy "Users can read own saved reps" on public.saved_reps for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own saved reps" on public.saved_reps for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own saved reps" on public.saved_reps for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own saved reps" on public.saved_reps for delete to authenticated using (auth.uid() = user_id);

-- ══════════════════════════════════════════════
-- ACTIONS (letters, calls, emails)
-- ══════════════════════════════════════════════
create table if not exists public.actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  rep_id text not null,
  rep_name text not null,
  method text not null check (method in ('letter', 'call', 'social')),
  issue text,
  content text,
  concern text,

  -- Delivery tracking
  delivery_status text default 'drafted' check (delivery_status in ('drafted', 'emailed', 'called', 'mailed')),
  emailed_at timestamptz,
  called_at timestamptz,
  mailed_at timestamptz,

  -- Physical mail tracking (Lob + Stripe)
  stripe_session_id text,
  lob_letter_id text,
  lob_tracking_url text,
  expected_delivery_date date,

  -- Points
  points_awarded integer default 0,

  created_at timestamptz default now()
);

alter table public.actions enable row level security;
create policy "Users can read own actions" on public.actions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own actions" on public.actions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own actions" on public.actions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role full access on actions" on public.actions for all to service_role using (true) with check (true);
-- No DELETE policy — actions are permanent audit records

create index idx_actions_user_id on public.actions(user_id);
create index idx_actions_created_at on public.actions(created_at desc);

-- ══════════════════════════════════════════════
-- ENGAGEMENT (aggregated stats per user)
-- ══════════════════════════════════════════════
create table if not exists public.engagement (
  user_id uuid references public.profiles on delete cascade primary key,
  total_points integer default 0,
  level text default 'Citizen' check (level in ('Citizen', 'Activist', 'Organizer', 'Leader', 'Champion')),
  letters_sent integer default 0,
  calls_made integer default 0,
  emails_sent integer default 0,
  letters_mailed integer default 0,
  unique_reps integer default 0,
  unique_issues integer default 0,
  streak_days integer default 0,
  longest_streak integer default 0,
  last_action_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.engagement enable row level security;
create policy "Users can view own engagement" on public.engagement for select to authenticated using (auth.uid() = user_id);
create policy "Service role full access on engagement" on public.engagement for all to service_role using (true) with check (true);
-- No user UPDATE/INSERT — engagement is managed server-side only

-- Auto-create engagement row on profile creation
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.engagement (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ══════════════════════════════════════════════
-- POINT EVENTS (audit log)
-- ══════════════════════════════════════════════
create table if not exists public.point_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  action_type text not null,
  points integer not null,
  description text,
  action_id uuid references public.actions on delete set null,
  created_at timestamptz default now()
);

alter table public.point_events enable row level security;
create policy "Users can read own point events" on public.point_events for select to authenticated using (auth.uid() = user_id);
create policy "Service role can insert point events" on public.point_events for insert to service_role with check (true);
create policy "Service role can update point events" on public.point_events for update to service_role using (true);
-- No user INSERT/UPDATE/DELETE — points are managed server-side only

create index idx_point_events_user_id on public.point_events(user_id);
create index idx_point_events_created_at on public.point_events(created_at desc);

-- ══════════════════════════════════════════════
-- LEADERBOARD VIEW (top activists — read-only)
-- ══════════════════════════════════════════════
create or replace view public.leaderboard as
select
  p.display_name,
  p.avatar_url,
  e.total_points,
  e.level,
  e.streak_days,
  e.letters_sent + e.calls_made + e.emails_sent as total_actions
from public.engagement e
join public.profiles p on p.id = e.user_id
where e.total_points > 0
order by e.total_points desc
limit 100;

-- Leaderboard: authenticated users can read only
revoke all on public.leaderboard from anon;
revoke all on public.leaderboard from public;
grant select on public.leaderboard to authenticated;
