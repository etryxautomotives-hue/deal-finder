-- deal'ke households: share one shopping list with family or friends.
-- A household has members (each with a name and a profile picture) and shared list items that everyone
-- can add, tick off and remove. People join with an invite link; only members ever see a household.
-- Run once in Supabase > SQL editor (docs/SETUP-FAMILY.md).

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Thuis',
  owner uuid not null references auth.users on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  name text,                 -- what the others see ("Mama", "Jonas")
  avatar text,               -- "a:fox" for a built-in picture, or a small data:image/jpeg URL (max ~60 kB)
  joined_at timestamptz default now(),
  primary key (household_id, user_id),
  constraint avatar_small check (avatar is null or length(avatar) < 80000)
);

create table if not exists public.household_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households on delete cascade,
  q text not null check (length(q) between 1 and 60),   -- the product in your own words ("koffie")
  added_by uuid references auth.users on delete set null,
  done_by uuid references auth.users on delete set null, -- who ticked it off (null = still needed)
  done_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists household_items_hh on public.household_items (household_id);

create table if not exists public.household_invites (
  code text primary key,
  household_id uuid not null references public.households on delete cascade,
  created_by uuid not null references auth.users on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days'
);

-- One household per person keeps it simple: joining another one means leaving the first.
create unique index if not exists one_household_per_person on public.household_members (user_id);

-- Is the signed-in person a member? (security definer, so the policies below don't call themselves)
create or replace function public.is_member(hh uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from household_members where household_id = hh and user_id = auth.uid())
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_items enable row level security;
alter table public.household_invites enable row level security;

drop policy if exists "members read household" on public.households;
create policy "members read household" on public.households for select using (public.is_member(id));
drop policy if exists "owner renames household" on public.households;
create policy "owner renames household" on public.households for update using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "owner deletes household" on public.households;
create policy "owner deletes household" on public.households for delete using (owner = auth.uid());

drop policy if exists "members see each other" on public.household_members;
create policy "members see each other" on public.household_members for select using (public.is_member(household_id));
drop policy if exists "edit own name and picture" on public.household_members;
create policy "edit own name and picture" on public.household_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
-- leave yourself, or the owner removes someone
drop policy if exists "leave or remove" on public.household_members;
create policy "leave or remove" on public.household_members for delete using (
  user_id = auth.uid() or exists (select 1 from households h where h.id = household_id and h.owner = auth.uid()));

drop policy if exists "members share the list" on public.household_items;
create policy "members share the list" on public.household_items for all
  using (public.is_member(household_id)) with check (public.is_member(household_id));

drop policy if exists "members see invites" on public.household_invites;
create policy "members see invites" on public.household_invites for select using (public.is_member(household_id));

-- Members may only change their own name and picture (never which household they're in), owners only the name.
revoke update on public.household_members from authenticated, anon;
grant update (name, avatar) on public.household_members to authenticated;
revoke update on public.households from authenticated, anon;
grant update (name) on public.households to authenticated;

-- Start a household (or return the one you're in), with you as the first member.
create or replace function public.create_household(hh_name text default 'Thuis', my_name text default null, my_avatar text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is not null then return hid; end if;
  insert into households (name, owner) values (coalesce(nullif(trim(hh_name), ''), 'Thuis'), auth.uid()) returning id into hid;
  insert into household_members (household_id, user_id, name, avatar) values (hid, auth.uid(), my_name, my_avatar);
  return hid;
end $$;

-- A fresh invite code for your household (valid 14 days, usable by several people).
create or replace function public.invite_code() returns text
language plpgsql security definer set search_path = public as $$
declare hid uuid; c text;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is null then raise exception 'no household'; end if;
  delete from household_invites where expires_at < now();
  c := substr(md5(gen_random_uuid()::text || clock_timestamp()::text), 1, 12);
  insert into household_invites (code, household_id, created_by) values (c, hid, auth.uid());
  return c;
end $$;

-- Join with a code from a link. Leaves your current household first (and deletes it if you were alone).
create or replace function public.join_household(code text, my_name text default null, my_avatar text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare hid uuid; old uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select household_id into hid from household_invites i where i.code = join_household.code and i.expires_at > now();
  if hid is null then raise exception 'invite expired'; end if;
  select household_id into old from household_members where user_id = auth.uid();
  if old = hid then return hid; end if;
  if old is not null then
    delete from household_members where household_id = old and user_id = auth.uid();
    delete from households h where h.id = old and not exists (select 1 from household_members m where m.household_id = old);
  end if;
  insert into household_members (household_id, user_id, name, avatar) values (hid, auth.uid(), my_name, my_avatar);
  return hid;
end $$;

grant execute on function public.create_household(text, text, text), public.invite_code(), public.join_household(text, text, text) to authenticated;

-- Ticks show up on the other phones straight away
do $$ begin
  alter publication supabase_realtime add table public.household_items;
exception when duplicate_object or undefined_object then null; end $$;
