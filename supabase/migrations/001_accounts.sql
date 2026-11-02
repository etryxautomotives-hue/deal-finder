-- deal'ke accounts: one profile per user (subscription state, written only by the Stripe webhook)
-- and one row of saved data per user (list, recipes, ticks, weekly plan), written by the user.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  stripe_customer_id text unique,
  subscription_status text,          -- trialing, active, past_due, canceled, ... (Stripe's words)
  trial_end timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  list jsonb default '{}'::jsonb,
  recipes jsonb default '[]'::jsonb,
  have jsonb default '{}'::jsonb,
  plan jsonb default '[]'::jsonb,
  prefs jsonb default '{}'::jsonb,   -- postcode, radius, language
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

-- People can read their own profile but never change it: subscription fields come from Stripe only.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "own data" on public.user_data;
create policy "own data" on public.user_data for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create both rows when someone signs up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict do nothing;
  insert into public.user_data (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
