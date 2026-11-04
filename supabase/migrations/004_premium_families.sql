-- deal'ke Premium: Single (€4,99 a month, one person) and Family (€12,99 a month, up to 5 people, only the owner pays).
-- Run AFTER 003_households.sql, in Supabase > SQL editor (docs/SETUP-PREMIUM.md).
--
-- A family IS a household from 003 (same tables, same shared list), now with an owner, roles, a paid subscription,
-- email-bound invitations and an activity log. Everything is checked here in the database, never in the browser:
--   * nobody can give themselves Premium, a role, or a family: those columns are written only by the functions below
--     (security definer) or by the Stripe webhook (service role);
--   * a family's list, shared deals and activity are readable only by its ACTIVE members, and only while the family's
--     subscription is paid (or inside the 3-day grace after a failed payment);
--   * family data is never deleted when a subscription ends or the owner leaves: it is just locked until paid again.

-- ---------- subscriptions (one row per Stripe subscription) ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_type text not null check (plan_type in ('single', 'family')),
  user_id uuid references auth.users on delete set null,          -- Single: the one person it is for
  family_id uuid references public.households on delete set null, -- Family: the family it is for
  payer_id uuid references auth.users on delete set null,         -- who pays (the owner, for Family)
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null default 'incomplete',                      -- Stripe's word: active, past_due, canceled, ...
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_payment_status text check (last_payment_status in ('paid', 'failed')),
  grace_until timestamptz,                                        -- set when a payment fails: 3 days to fix it
  synced_at timestamptz,                                          -- time of the Stripe state last written (older ones are ignored)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- belongs to a person OR a family, never both
  constraint sub_owner check ((plan_type = 'single' and family_id is null) or (plan_type = 'family' and user_id is null))
);
create index if not exists subscriptions_user on public.subscriptions (user_id);
create index if not exists subscriptions_family on public.subscriptions (family_id);
create index if not exists subscriptions_payer on public.subscriptions (payer_id);

-- Stripe event ids we've handled, so a webhook delivered twice is applied once
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now()
);

-- ---------- families (= households) ----------
alter table public.households add column if not exists max_members int not null default 5;
alter table public.households add column if not exists status text not null default 'active';
alter table public.households add column if not exists subscription_id uuid references public.subscriptions on delete set null;
do $$ begin
  alter table public.households add constraint households_max check (max_members between 1 and 5);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.households add constraint households_status check (status in ('active', 'closed'));
exception when duplicate_object then null; end $$;
-- If the owner's account is deleted the family is NOT deleted with it (003 had "on delete cascade"): it stays, locked.
alter table public.households drop constraint if exists households_owner_fkey;
alter table public.households alter column owner drop not null;
alter table public.households add constraint households_owner_fkey foreign key (owner) references auth.users on delete set null;

alter table public.household_members add column if not exists id uuid not null default gen_random_uuid();
alter table public.household_members add column if not exists role text not null default 'member';
alter table public.household_members add column if not exists status text not null default 'active';
alter table public.household_members add column if not exists removed_at timestamptz;
do $$ begin
  alter table public.household_members add constraint member_role check (role in ('owner', 'member'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.household_members add constraint member_status check (status in ('active', 'removed'));
exception when duplicate_object then null; end $$;
create unique index if not exists household_members_id on public.household_members (id);
update public.household_members m set role = 'owner' from public.households h where h.id = m.household_id and h.owner = m.user_id;
-- one ACTIVE family per person (removed memberships stay as history); one owner per family
drop index if exists public.one_household_per_person;
create unique index if not exists one_active_family_per_person on public.household_members (user_id) where status = 'active';
create unique index if not exists one_owner_per_family on public.household_members (household_id) where role = 'owner' and status = 'active';

-- ---------- the shared list: quantities, who changed what, and when ----------
alter table public.household_items add column if not exists qty int not null default 1;
alter table public.household_items add column if not exists updated_by uuid references auth.users on delete set null;
alter table public.household_items add column if not exists updated_at timestamptz not null default now();
alter table public.household_items add column if not exists saved numeric(7,2) not null default 0;   -- what this purchase saved (for the family's savings)
alter table public.household_items add column if not exists cleared_at timestamptz;                  -- "clear bought items" hides, never deletes
do $$ begin
  alter table public.household_items add constraint item_qty check (qty between 1 and 99);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.household_items add constraint item_saved check (saved between 0 and 500);
exception when duplicate_object then null; end $$;

-- deals saved for the whole family (a personal saved deal only goes here when someone presses "share with family")
create table if not exists public.family_deals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households on delete cascade,
  deal_id text not null check (length(deal_id) between 1 and 200),
  data jsonb not null default '{}'::jsonb check (length(data::text) < 4000),   -- the deal as it was, so it survives a new week
  added_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  unique (household_id, deal_id)
);

-- ---------- invitations: bound to one email address, 48 hours, used once, only the hash is stored ----------
create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.households on delete cascade,
  invited_email text not null check (invited_email = lower(invited_email) and invited_email like '%_@_%'),
  invited_by uuid references auth.users on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '48 hours',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  accepted_by uuid references auth.users on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists family_invitations_family on public.family_invitations (family_id);

-- ---------- activity: who joined, left, added or bought something ----------
create table if not exists public.family_activity (
  id bigserial primary key,
  family_id uuid not null references public.households on delete cascade,
  user_id uuid references auth.users on delete set null,
  action text not null,           -- family_created, invite_sent, invite_revoked, member_joined, member_left, member_removed,
                                  -- item_added, item_bought, item_removed, deal_shared, plan_changed, payment_failed, ...
  target_type text,
  target_id text,
  created_at timestamptz not null default now()
);
create index if not exists family_activity_family on public.family_activity (family_id, created_at desc);

-- ---------- the checks every rule below uses (security definer: they read past RLS, and policies can't call themselves) ----------
-- A subscription that gives access right now: paid, or within 3 days of a failed payment.
create or replace function public.sub_live(st text, period_end timestamptz, grace timestamptz) returns boolean
language sql stable as $$
  select (st in ('active', 'trialing') and (period_end is null or period_end > now() - interval '1 day'))
      or (st in ('past_due', 'unpaid') and grace is not null and grace > now())
$$;

-- active member (owner or member) of this family
create or replace function public.is_member(hh uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from household_members where household_id = hh and user_id = auth.uid() and status = 'active')
$$;

create or replace function public.is_owner(hh uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from household_members where household_id = hh and user_id = auth.uid() and status = 'active' and role = 'owner')
$$;

-- the family has a paid Family subscription right now
create or replace function public.family_premium(hh uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from households h join subscriptions s on s.id = h.subscription_id
    where h.id = hh and h.status = 'active' and s.plan_type = 'family' and s.family_id = h.id
      and sub_live(s.status, s.current_period_end, s.grace_until))
$$;

-- may the signed-in person use this family's shared things?
create or replace function public.family_access(hh uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select public.is_member(hh) and public.family_premium(hh)
$$;

-- does this person have Premium (their own Single, or an active place in a paid family)?
create or replace function public.has_premium(uid uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from subscriptions s where s.plan_type = 'single' and s.user_id = uid
                   and sub_live(s.status, s.current_period_end, s.grace_until))
      or exists (select 1 from household_members m where m.user_id = uid and m.status = 'active' and family_premium(m.household_id))
$$;

-- ---------- row level security ----------
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
alter table public.family_deals enable row level security;
alter table public.family_invitations enable row level security;
alter table public.family_activity enable row level security;

-- Only the payer sees a subscription row (period, payment status). Members see the family's status through my_plan().
drop policy if exists "payer reads subscription" on public.subscriptions;
create policy "payer reads subscription" on public.subscriptions for select using (payer_id = auth.uid() or user_id = auth.uid());
revoke insert, update, delete on public.subscriptions from authenticated, anon;
revoke all on public.stripe_events from authenticated, anon;   -- no policies: only the webhook (service role)

-- families: members read, the owner renames; nobody deletes (003's delete policy goes)
drop policy if exists "owner deletes household" on public.households;
revoke delete, insert on public.households from authenticated, anon;
drop policy if exists "owner renames household" on public.households;
create policy "owner renames household" on public.households for update using (public.is_owner(id)) with check (public.is_owner(id));

-- members: see the others in your family (only while you're active), change only your own name and picture.
-- Joining, leaving and removing go through the functions below, so roles and status can't be changed by hand.
drop policy if exists "members see each other" on public.household_members;
create policy "members see each other" on public.household_members for select using (public.is_member(household_id) and status = 'active' or user_id = auth.uid());
drop policy if exists "edit own name and picture" on public.household_members;
create policy "edit own name and picture" on public.household_members for update using (user_id = auth.uid() and status = 'active') with check (user_id = auth.uid());
drop policy if exists "leave or remove" on public.household_members;
revoke insert, delete on public.household_members from authenticated, anon;

-- the shared list: active members of a paid family only. Columns: you can't move an item to another family,
-- and who added / ticked / changed it is filled in by the database, not the phone.
drop policy if exists "members share the list" on public.household_items;
drop policy if exists "family reads list" on public.household_items;
drop policy if exists "family adds" on public.household_items;
drop policy if exists "family changes" on public.household_items;
drop policy if exists "family removes" on public.household_items;
create policy "family reads list" on public.household_items for select using (public.family_access(household_id));
create policy "family adds" on public.household_items for insert with check (public.family_access(household_id));
create policy "family changes" on public.household_items for update using (public.family_access(household_id)) with check (public.family_access(household_id));
create policy "family removes" on public.household_items for delete using (public.family_access(household_id));
revoke insert, update on public.household_items from authenticated, anon;
grant select, delete on public.household_items to authenticated;
grant insert (household_id, q, qty) on public.household_items to authenticated;
grant update (q, qty, done_by, done_at, saved, cleared_at) on public.household_items to authenticated;

drop policy if exists "family reads deals" on public.family_deals;
drop policy if exists "family shares deals" on public.family_deals;
drop policy if exists "family unshares deals" on public.family_deals;
create policy "family reads deals" on public.family_deals for select using (public.family_access(household_id));
create policy "family shares deals" on public.family_deals for insert with check (public.family_access(household_id));
create policy "family unshares deals" on public.family_deals for delete using (public.family_access(household_id));
revoke insert, update on public.family_deals from authenticated, anon;
grant select, delete on public.family_deals to authenticated;
grant insert (household_id, deal_id, data) on public.family_deals to authenticated;

-- the owner sees the family's invitations (to cancel them); nobody writes them directly
drop policy if exists "owner sees invitations" on public.family_invitations;
create policy "owner sees invitations" on public.family_invitations for select using (public.is_owner(family_id));
revoke insert, update, delete on public.family_invitations from authenticated, anon;

drop policy if exists "family sees activity" on public.family_activity;
create policy "family sees activity" on public.family_activity for select using (public.family_access(family_id));
revoke insert, update, delete on public.family_activity from authenticated, anon;

-- 003's free sharing goes: families are made by paying, people join with an email invitation
drop policy if exists "members see invites" on public.household_invites;
revoke all on public.household_invites from authenticated, anon;
drop function if exists public.create_household(text, text, text);
drop function if exists public.invite_code();
drop function if exists public.join_household(text, text, text);

-- ---------- who did it, filled in by the database ----------
create or replace function public.log_activity(hh uuid, who uuid, act text, ttype text default null, tid text default null)
returns void language sql security definer set search_path = public as $$
  insert into family_activity (family_id, user_id, action, target_type, target_id) values (hh, who, act, ttype, tid)
$$;
revoke execute on function public.log_activity(uuid, uuid, text, text, text) from public, authenticated, anon;

create or replace function public.items_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.added_by := auth.uid(); new.created_at := now(); new.done_by := null; new.done_at := null; new.saved := 0; new.cleared_at := null;
  else
    -- a tick is always in the name of whoever ticks it, with the database's clock
    if new.done_by is not null and old.done_by is null then new.done_by := auth.uid(); new.done_at := now(); end if;
    if new.done_by is not null and old.done_by is not null and new.done_by is distinct from old.done_by then new.done_by := old.done_by; end if;
    if new.done_by is null then new.done_at := null; new.saved := 0; new.cleared_at := null; end if;
    if new.cleared_at is not null and old.cleared_at is null then new.cleared_at := now(); end if;
    if new.cleared_at is not null and new.done_by is null then new.cleared_at := null; end if;   -- only bought things can be cleared
  end if;
  return new;
end $$;
drop trigger if exists items_stamp on public.household_items;
create trigger items_stamp before insert or update on public.household_items for each row execute function public.items_stamp();

create or replace function public.items_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform log_activity(new.household_id, auth.uid(), 'item_added', 'item', new.id::text);
  elsif tg_op = 'DELETE' then perform log_activity(old.household_id, auth.uid(), 'item_removed', 'item', old.id::text); return old;
  elsif new.done_by is not null and old.done_by is null then perform log_activity(new.household_id, auth.uid(), 'item_bought', 'item', new.id::text);
  end if;
  return new;
end $$;
drop trigger if exists items_log on public.household_items;
create trigger items_log after insert or update or delete on public.household_items for each row execute function public.items_log();

create or replace function public.deals_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.added_by := auth.uid(); new.created_at := now();
  perform log_activity(new.household_id, auth.uid(), 'deal_shared', 'deal', new.deal_id);
  return new;
end $$;
drop trigger if exists deals_stamp on public.family_deals;
create trigger deals_stamp before insert on public.family_deals for each row execute function public.deals_stamp();

-- ---------- what the site shows on the account page (no payment details for members) ----------
create or replace function public.my_plan() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare me uuid := auth.uid(); s subscriptions; m household_members; h households; r jsonb;
begin
  if me is null then return jsonb_build_object('plan', 'free', 'premium', false); end if;
  select * into m from household_members where user_id = me and status = 'active';
  if m.household_id is not null then select * into h from households where id = m.household_id; end if;
  -- your own Single, if you have one that is still running (or failed and in its grace days)
  select * into s from subscriptions where plan_type = 'single' and user_id = me
    order by sub_live(status, current_period_end, grace_until) desc, updated_at desc limit 1;
  r := jsonb_build_object('premium', has_premium(me), 'plan', 'free');
  if s.id is not null and (sub_live(s.status, s.current_period_end, s.grace_until) or s.status in ('past_due', 'unpaid')) then
    r := r || jsonb_build_object('plan', 'single', 'status', s.status, 'period_end', s.current_period_end,
      'cancel_at_period_end', s.cancel_at_period_end, 'payment', s.last_payment_status, 'grace_until', s.grace_until,
      'live', sub_live(s.status, s.current_period_end, s.grace_until));
  end if;
  if h.id is not null then
    r := r || jsonb_build_object('family', jsonb_build_object(
      'id', h.id, 'name', h.name, 'role', m.role, 'max', h.max_members,
      'owner_name', (select name from household_members where household_id = h.id and role = 'owner' and status = 'active'),
      'members', (select count(*) from household_members where household_id = h.id and status = 'active'),
      'pending', (select count(*) from family_invitations where family_id = h.id and status = 'pending' and expires_at > now()),
      'live', family_premium(h.id)));
    if m.role = 'owner' then
      select * into s from subscriptions where id = h.subscription_id;
      if s.id is not null then
        r := r || jsonb_build_object('plan', 'family', 'status', s.status, 'period_end', s.current_period_end,
          'cancel_at_period_end', s.cancel_at_period_end, 'payment', s.last_payment_status, 'grace_until', s.grace_until,
          'live', sub_live(s.status, s.current_period_end, s.grace_until));
      end if;
    elsif r->>'plan' = 'free' then
      r := r || jsonb_build_object('plan', 'family_member', 'live', family_premium(h.id),
        'status', case when family_premium(h.id) then 'active' else 'paused' end);
    end if;
  end if;
  return r;
end $$;

-- ---------- invitations ----------
-- The owner invites one email address. Returns the secret token ONCE (only its hash is kept): the site puts it in a link.
create or replace function public.create_invitation(email text) returns text
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); hh uuid; e text := lower(trim(email)); tok text; taken int; cap int;
begin
  if me is null then raise exception 'not signed in'; end if;
  select household_id into hh from household_members where user_id = me and status = 'active' and role = 'owner';
  if hh is null then raise exception 'only the owner can invite'; end if;
  if not family_premium(hh) then raise exception 'family not paid'; end if;
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'bad email'; end if;
  if e = (select lower(u.email) from auth.users u where u.id = me) then raise exception 'that is you'; end if;
  if exists (select 1 from household_members m join auth.users u on u.id = m.user_id
             where m.household_id = hh and m.status = 'active' and lower(u.email) = e) then raise exception 'already a member'; end if;
  perform 1 from households where id = hh for update;   -- one change to this family's places at a time
  update family_invitations set status = 'expired' where family_id = hh and status = 'pending' and expires_at <= now();
  update family_invitations set status = 'revoked' where family_id = hh and status = 'pending' and invited_email = e;  -- a new link replaces the old
  select max_members into cap from households where id = hh;
  select (select count(*) from household_members where household_id = hh and status = 'active')
       + (select count(*) from family_invitations where family_id = hh and status = 'pending') into taken;
  if taken >= cap then raise exception 'family full'; end if;
  tok := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');   -- 244 random bits
  insert into family_invitations (family_id, invited_email, invited_by, token_hash)
    values (hh, e, me, encode(sha256(convert_to(tok, 'UTF8')), 'hex'));
  perform log_activity(hh, me, 'invite_sent', 'email', e);
  return tok;
end $$;

create or replace function public.revoke_invitation(invite uuid) returns void
language plpgsql security definer set search_path = public as $$
declare hh uuid;
begin
  select family_id into hh from family_invitations where id = invite and status = 'pending';
  if hh is null or not is_owner(hh) then raise exception 'not allowed'; end if;
  update family_invitations set status = 'revoked' where id = invite;
  perform log_activity(hh, auth.uid(), 'invite_revoked', 'invitation', invite::text);
end $$;

-- What a link is for, before accepting (family name and who invited), only for the invited address.
create or replace function public.invitation_info(token text) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare i family_invitations; me_email text;
begin
  select * into i from family_invitations where token_hash = encode(sha256(convert_to(coalesce(token, ''), 'UTF8')), 'hex');
  if i.id is null then return jsonb_build_object('ok', false, 'reason', 'unknown'); end if;
  select lower(email) into me_email from auth.users where id = auth.uid();
  if i.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', i.status); end if;
  if i.expires_at <= now() then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
  if me_email is distinct from i.invited_email then return jsonb_build_object('ok', false, 'reason', 'other_email', 'email_hint',
    left(i.invited_email, 2) || '…@' || split_part(i.invited_email, '@', 2)); end if;
  return jsonb_build_object('ok', true, 'family', (select name from households where id = i.family_id),
    'owner', (select name from household_members where household_id = i.family_id and role = 'owner' and status = 'active'));
end $$;

-- Accept: signed in with the invited address, the link unused and fresh, and a place still free (checked under a lock,
-- so two people accepting at the same moment can never make a sixth member).
create or replace function public.accept_invitation(token text, my_name text default null, my_avatar text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); i family_invitations; me_email text; cur household_members; cap int; n int;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into i from family_invitations where token_hash = encode(sha256(convert_to(coalesce(token, ''), 'UTF8')), 'hex') for update;
  if i.id is null then raise exception 'invite unknown'; end if;
  if i.status = 'accepted' and i.accepted_by = me then return i.family_id; end if;      -- pressed twice: fine, nothing changes
  if i.status <> 'pending' then raise exception 'invite %', i.status; end if;
  if i.expires_at <= now() then update family_invitations set status = 'expired' where id = i.id; raise exception 'invite expired'; end if;
  select lower(email) into me_email from auth.users where id = me;
  if me_email is distinct from i.invited_email then raise exception 'invite is for another email'; end if;
  select * into cur from household_members where user_id = me and status = 'active';
  if cur.household_id = i.family_id then
    update family_invitations set status = 'accepted', accepted_by = me, accepted_at = now() where id = i.id; return i.family_id;
  end if;
  if cur.household_id is not null then raise exception 'leave your family first'; end if;
  -- someone paying for Single must cancel it first (it may run out until the end of the month), so nobody pays twice
  if exists (select 1 from subscriptions where plan_type = 'single' and user_id = me and not cancel_at_period_end
             and sub_live(status, current_period_end, grace_until)) then raise exception 'cancel single first'; end if;
  perform 1 from households where id = i.family_id for update;
  if not family_premium(i.family_id) then raise exception 'family not paid'; end if;
  select max_members into cap from households where id = i.family_id;
  select count(*) into n from household_members where household_id = i.family_id and status = 'active';
  if n >= cap then raise exception 'family full'; end if;
  insert into household_members (household_id, user_id, name, avatar, role, status, joined_at, removed_at)
    values (i.family_id, me, left(coalesce(nullif(trim(my_name), ''), split_part(me_email, '@', 1)), 30), case when length(my_avatar) < 80000 then my_avatar end, 'member', 'active', now(), null)
    on conflict (household_id, user_id) do update set status = 'active', role = 'member', joined_at = now(), removed_at = null,
      name = coalesce(excluded.name, household_members.name), avatar = coalesce(excluded.avatar, household_members.avatar);
  update family_invitations set status = 'accepted', accepted_by = me, accepted_at = now() where id = i.id;
  perform log_activity(i.family_id, me, 'member_joined', 'user', me::text);
  return i.family_id;
end $$;

-- The owner removes someone: they lose access at once (every rule checks status = 'active'). Their row stays as history.
create or replace function public.remove_member(member uuid) returns void
language plpgsql security definer set search_path = public as $$
declare hh uuid;
begin
  select household_id into hh from household_members where user_id = auth.uid() and status = 'active' and role = 'owner';
  if hh is null then raise exception 'only the owner can remove'; end if;
  if member = auth.uid() then raise exception 'the owner cannot remove themselves'; end if;
  update household_members set status = 'removed', removed_at = now() where household_id = hh and user_id = member and status = 'active';
  if not found then raise exception 'not a member'; end if;
  perform log_activity(hh, auth.uid(), 'member_removed', 'user', member::text);
end $$;

-- A member leaves. The owner can't just leave a family with people in it or with a running subscription:
-- first remove the others and cancel (ownership is never handed over without asking, data is never deleted).
create or replace function public.leave_family() returns void
language plpgsql security definer set search_path = public as $$
declare m household_members; others int;
begin
  select * into m from household_members where user_id = auth.uid() and status = 'active';
  if m.household_id is null then raise exception 'not in a family'; end if;
  if m.role = 'owner' then
    select count(*) into others from household_members where household_id = m.household_id and status = 'active' and user_id <> auth.uid();
    if others > 0 then raise exception 'remove the others first'; end if;
    if family_premium(m.household_id) and not coalesce((select s.cancel_at_period_end from households h join subscriptions s on s.id = h.subscription_id where h.id = m.household_id), false)
      then raise exception 'cancel the subscription first'; end if;
    update households set status = 'closed' where id = m.household_id;
  end if;
  update household_members set status = 'removed', removed_at = now() where household_id = m.household_id and user_id = auth.uid();
  perform log_activity(m.household_id, auth.uid(), 'member_left', 'user', auth.uid()::text);
end $$;

-- Owner only: the family's name
create or replace function public.rename_family(new_name text) returns void
language plpgsql security definer set search_path = public as $$
declare hh uuid;
begin
  select household_id into hh from household_members where user_id = auth.uid() and status = 'active' and role = 'owner';
  if hh is null then raise exception 'only the owner'; end if;
  update households set name = coalesce(nullif(left(trim(new_name), 40), ''), name) where id = hh;
end $$;

-- What the payment functions need to decide (called by them with the person's own token, so auth.uid() is that person)
create or replace function public.checkout_check(want text) returns text
language plpgsql security definer stable set search_path = public as $$
declare me uuid := auth.uid(); m household_members; single subscriptions; fam subscriptions; others int;
begin
  if me is null then return 'not signed in'; end if;
  if want not in ('single', 'family') then return 'bad plan'; end if;
  select * into m from household_members where user_id = me and status = 'active';
  select * into single from subscriptions where plan_type = 'single' and user_id = me and sub_live(status, current_period_end, grace_until) limit 1;
  if m.role = 'owner' then select s.* into fam from households h join subscriptions s on s.id = h.subscription_id where h.id = m.household_id; end if;
  if m.household_id is not null and m.role = 'member' then return 'member: leave the family first'; end if;
  if want = 'single' then
    if single.id is not null then return 'already single'; end if;
    if fam.id is not null and sub_live(fam.status, fam.current_period_end, fam.grace_until) then
      select count(*) into others from household_members where household_id = m.household_id and status = 'active' and user_id <> me;
      if others > 0 then return 'owner: remove members first'; end if;
      return 'switch:' || fam.stripe_subscription_id;
    end if;
    return 'new';
  end if;
  if fam.id is not null and sub_live(fam.status, fam.current_period_end, fam.grace_until) then return 'already family'; end if;
  if single.id is not null then return 'switch:' || single.stripe_subscription_id; end if;
  return 'new';
end $$;

grant execute on function public.my_plan(), public.create_invitation(text), public.revoke_invitation(uuid), public.invitation_info(text),
  public.accept_invitation(text, text, text), public.remove_member(uuid), public.leave_family(), public.rename_family(text),
  public.checkout_check(text), public.has_premium(uuid) to authenticated;

-- ---------- Stripe -> database (only the webhook calls this, with the service role key) ----------
-- p: { event_id, type, created (unix), state_at (unix), customer, subscription, payer (user id), plan ('single'|'family'),
--      status, period_start, period_end (unix), cancel_at_period_end, invoice ('paid'|'failed'|null) }
-- The webhook fetches the subscription fresh from Stripe for every event, so the state here is always Stripe's latest.
-- Returns what happened: duplicate, ignored, ok, conflict_member, duplicate_subscription.
create or replace function public.stripe_apply(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare s subscriptions; payer uuid; plan text := p->>'plan'; hh uuid; old_plan text; result text := 'ok';
  at timestamptz := to_timestamp(coalesce((p->>'state_at')::bigint, (p->>'created')::bigint, extract(epoch from now())::bigint));
begin
  insert into stripe_events (id, type) values (p->>'event_id', p->>'type') on conflict do nothing;
  if not found then return 'duplicate'; end if;
  if coalesce(p->>'subscription', '') = '' then return 'ignored'; end if;
  select * into s from subscriptions where stripe_subscription_id = p->>'subscription' for update;
  payer := coalesce(s.payer_id, nullif(p->>'payer', '')::uuid, (select id from profiles where stripe_customer_id = p->>'customer'));
  if plan is null then plan := s.plan_type; end if;
  if payer is null or plan not in ('single', 'family') then return 'ignored'; end if;
  if s.id is null then
    if p->>'type' = 'customer.subscription.deleted' then return 'ignored'; end if;
    insert into subscriptions (plan_type, user_id, payer_id, stripe_customer_id, stripe_subscription_id, status)
      values ('single', null, payer, p->>'customer', p->>'subscription', 'incomplete') returning * into s;
    -- someone with another subscription that still runs: Stripe got a second one (two tabs); the webhook cancels it
    if exists (select 1 from subscriptions x where x.payer_id = payer and x.id <> s.id and sub_live(x.status, x.current_period_end, x.grace_until)
               and not x.cancel_at_period_end) then result := 'duplicate_subscription'; end if;
  end if;
  old_plan := case when s.user_id is null and s.family_id is null then null else s.plan_type end;

  -- which person or family it belongs to
  if plan = 'family' and (old_plan is distinct from 'family') then
    select household_id into hh from household_members where user_id = payer and status = 'active' and role = 'owner';
    if hh is null and exists (select 1 from household_members where user_id = payer and status = 'active') then
      result := 'conflict_member';     -- a member of someone else's family can't own a family too
    else
      if hh is null then
        insert into households (name, owner) values ('Ons gezin', payer) returning id into hh;
        insert into household_members (household_id, user_id, name, avatar, role, status)
          values (hh, payer, coalesce((select nullif(prefs->'me'->>'name', '') from user_data where user_id = payer), (select split_part(email, '@', 1) from auth.users where id = payer)),
                  (select case when length(prefs->'me'->>'avatar') < 80000 then prefs->'me'->>'avatar' end from user_data where user_id = payer), 'owner', 'active');
        perform log_activity(hh, payer, 'family_created', 'family', hh::text);
      end if;
      update subscriptions set plan_type = 'family', user_id = null, family_id = hh where id = s.id;
      update households set subscription_id = s.id, status = 'active' where id = hh;
      if old_plan = 'single' then perform log_activity(hh, payer, 'plan_changed', 'plan', 'single->family'); end if;
    end if;
  elsif plan = 'single' and (old_plan is distinct from 'single') then
    if s.family_id is not null then
      update households set subscription_id = null where id = s.family_id and subscription_id = s.id;   -- the family is locked, not deleted
      perform log_activity(s.family_id, payer, 'plan_changed', 'plan', 'family->single');
    end if;
    update subscriptions set plan_type = 'single', family_id = null, user_id = payer where id = s.id;
  end if;

  -- the state (only if it is newer than what we have)
  if s.synced_at is null or at >= s.synced_at then
    update subscriptions set
      status = case when p->>'type' = 'customer.subscription.deleted' then 'canceled' else coalesce(p->>'status', status) end,
      current_period_start = coalesce(to_timestamp((p->>'period_start')::bigint), current_period_start),
      current_period_end = coalesce(to_timestamp((p->>'period_end')::bigint), current_period_end),
      cancel_at_period_end = coalesce((p->>'cancel_at_period_end')::boolean, cancel_at_period_end),
      synced_at = at, updated_at = now()
    where id = s.id;
  end if;
  -- payments: a failure starts 3 days of grace (once); a payment or a healthy status ends it
  if p->>'invoice' = 'failed' then
    update subscriptions set last_payment_status = 'failed', grace_until = coalesce(grace_until, now() + interval '3 days'), updated_at = now() where id = s.id;
    select family_id into hh from subscriptions where id = s.id;
    if hh is not null then perform log_activity(hh, payer, 'payment_failed', 'subscription', s.id::text); end if;
  elsif p->>'invoice' = 'paid' then
    update subscriptions set last_payment_status = 'paid', grace_until = null, updated_at = now() where id = s.id;
  end if;
  update subscriptions set grace_until = case
      when status in ('active', 'trialing') and last_payment_status is distinct from 'failed' then null
      when status in ('past_due', 'unpaid') then coalesce(grace_until, now() + interval '3 days')
      else grace_until end
    where id = s.id;
  return result;
end $$;
revoke execute on function public.stripe_apply(jsonb) from public, authenticated, anon;
-- the service role (the webhook) may run it
do $$ begin grant execute on function public.stripe_apply(jsonb) to service_role; exception when undefined_object then null; end $$;

-- If an owner's account is deleted, the family stays with its data but is locked (no owner, nobody paying)
create or replace function public.owner_gone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner is null and old.owner is not null then new.status := 'closed'; new.subscription_id := null; end if;
  return new;
end $$;
drop trigger if exists owner_gone on public.households;
create trigger owner_gone before update of owner on public.households for each row execute function public.owner_gone();

-- live updates on the other phones
do $$ begin alter publication supabase_realtime add table public.household_members; exception when duplicate_object or undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.family_deals; exception when duplicate_object or undefined_object then null; end $$;
