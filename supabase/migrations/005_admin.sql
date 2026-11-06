-- deal'ke admin back end: who may enter, anonymous usage statistics, the opt-in email list and site settings.
-- Run AFTER 004_premium_families.sql, in Supabase > SQL editor (docs/SETUP-ADMIN.md), then make yourself the owner:
--   insert into public.admins (user_id, email, role) select id, email, 'owner' from auth.users where email = 'YOUR@EMAIL';
--
-- Everything is checked HERE, in the database. The admin page (site/admin.html) is a public file anyone can open,
-- but without a row in public.admins every admin_* function refuses and every admin table is closed.
--
-- Privacy (GDPR / Belgian ePrivacy rules), built in on purpose:
--   * statistics (public.events) are only sent after a visitor accepts the cookie banner, and hold no account,
--     no email, no IP address and no full postcode: a random id per visit, what was clicked, phone/computer,
--     language and the first two digits of the postcode. Kept 13 months, then deleted automatically.
--   * the email list (admin_mailing_list) only holds people who ticked "send me deal'ke news" themselves.
--   * roles: viewer = anonymous reports only; admin = also users, email list and site settings; owner = also the team.
--   * every look at personal data (user list, email list) and every change is written to public.admin_log.

-- ---------- who may enter ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'viewer')),
  granted_by uuid references auth.users on delete set null,
  granted_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from authenticated, anon;          -- no policies: only through the functions below

create table if not exists public.admin_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users on delete set null,
  actor_email text,
  action text not null,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists admin_log_at on public.admin_log (at desc);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from authenticated, anon;

-- the signed-in person's admin role, or null
create or replace function public.admin_role() returns text
language sql security definer stable set search_path = public as $$
  select role from admins where user_id = auth.uid()
$$;

-- stop unless the signed-in person has at least this role (viewer < admin < owner)
create or replace function public.admin_need(min_role text) returns void
language plpgsql security definer stable set search_path = public as $$
declare r text := public.admin_role();
begin
  if r is null then raise exception 'not_admin' using errcode = '42501'; end if;
  if array_position(array['viewer', 'admin', 'owner'], r) < array_position(array['viewer', 'admin', 'owner'], min_role) then
    raise exception 'needs_%', min_role using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_note(act text, info jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public as $$
  insert into admin_log (actor, actor_email, action, detail)
  values (auth.uid(), (select email from admins where user_id = auth.uid()), act, coalesce(info, '{}'::jsonb))
$$;
revoke execute on function public.admin_need(text), public.admin_note(text, jsonb) from public, anon, authenticated;

-- ---------- anonymous usage statistics (only after "Accept" on the cookie banner) ----------
create table if not exists public.events (
  id bigserial primary key,
  at timestamptz not null default now(),
  visit text not null,      -- random per visit (the browser tab), never linked to an account
  kind text not null,       -- view, search, open_deal, add_list, to_store, directions, filter_store, filter_cat, recipe, pricing, signup
  store text,
  cat text,
  label text,               -- deal name, search words or page name (cut to 80 characters)
  n int,                    -- e.g. how many results a search gave
  lang text,
  device text,              -- phone, tablet or desktop
  area text                 -- first two digits of the postcode (a region, never the address)
);
create index if not exists events_at on public.events (at desc);
create index if not exists events_kind_at on public.events (kind, at desc);
alter table public.events enable row level security;
revoke all on public.events from authenticated, anon;

-- Daily totals, kept for good (Miro: "keep business and trend reports, remove the raw data"). Made from the raw
-- events once a day is over; the raw events themselves are deleted after 13 months. No visit ids in here.
create table if not exists public.stats_daily (
  day date not null,
  store text not null default '',
  kind text not null,
  events int not null,
  visits int not null,
  primary key (day, store, kind)
);
create table if not exists public.stats_daily_site (
  day date primary key,
  visits int not null,
  phone int not null default 0,
  tablet int not null default 0,
  desktop int not null default 0
);
alter table public.stats_daily enable row level security;
alter table public.stats_daily_site enable row level security;
revoke all on public.stats_daily, public.stats_daily_site from authenticated, anon;

-- add the totals of every finished day (Brussels time) that isn't in the daily tables yet
create or replace function public.stats_rollup() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  create temp table if not exists _days (d date) on commit drop;
  truncate _days;
  insert into _days select distinct (at at time zone 'Europe/Brussels')::date from events
    where (at at time zone 'Europe/Brussels')::date < (now() at time zone 'Europe/Brussels')::date
      and (at at time zone 'Europe/Brussels')::date not in (select day from stats_daily_site);
  insert into stats_daily (day, store, kind, events, visits)
    select (at at time zone 'Europe/Brussels')::date, coalesce(store, ''), kind, count(*), count(distinct visit)
    from events where (at at time zone 'Europe/Brussels')::date in (select d from _days) group by 1, 2, 3
    on conflict do nothing;
  insert into stats_daily_site (day, visits, phone, tablet, desktop)
    select (at at time zone 'Europe/Brussels')::date, count(distinct visit), count(distinct visit) filter (where device = 'phone'),
           count(distinct visit) filter (where device = 'tablet'), count(distinct visit) filter (where device = 'desktop')
    from events where (at at time zone 'Europe/Brussels')::date in (select d from _days) group by 1
    on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.stats_rollup() from public, anon, authenticated;

-- The site sends up to 40 events at a time. Unknown kinds and silly values are dropped, the time is the server's.
create or replace function public.track(batch jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; v text;
begin
  if jsonb_typeof(batch) <> 'array' or jsonb_array_length(batch) > 40 then return 0; end if;
  v := batch->0->>'visit';
  if v is null or v !~ '^[a-z0-9]{8,32}$' then return 0; end if;
  -- one visit can't flood the table
  if (select count(*) from events where visit = v and at > now() - interval '10 minutes') > 400 then return 0; end if;
  insert into events (visit, kind, store, cat, label, n, lang, device, area)
  select v, e->>'kind', left(e->>'store', 40), left(e->>'cat', 30), left(e->>'label', 80),
         case when (e->>'n') ~ '^\d{1,6}$' then (e->>'n')::int end,
         case when e->>'lang' in ('nl', 'fr', 'en') then e->>'lang' end,
         case when e->>'device' in ('phone', 'tablet', 'desktop') then e->>'device' end,
         case when (e->>'area') ~ '^\d{2}$' then e->>'area' end
  from jsonb_array_elements(batch) e
  where e->>'kind' in ('view', 'search', 'open_deal', 'add_list', 'to_store', 'directions', 'filter_store', 'filter_cat', 'recipe', 'pricing', 'signup');
  get diagnostics n = row_count;
  if random() < 0.01 then                         -- now and then: daily totals first, then raw events older than 13 months go
    perform stats_rollup();
    delete from events where at < now() - interval '13 months';
  end if;
  return n;
end $$;
grant execute on function public.track(jsonb) to anon, authenticated;

-- ---------- the email list: only people who said yes ----------
alter table public.profiles add column if not exists marketing_opt_in boolean not null default false;
alter table public.profiles add column if not exists marketing_opt_in_at timestamptz;

-- the person themselves says yes or no (account page, or the box at sign-up)
create or replace function public.set_marketing(yes boolean) returns boolean
language sql security definer set search_path = public as $$
  update profiles set marketing_opt_in = coalesce(yes, false),
         marketing_opt_in_at = case when coalesce(yes, false) then coalesce(case when marketing_opt_in then marketing_opt_in_at end, now()) end
  where id = auth.uid()
  returning marketing_opt_in
$$;
grant execute on function public.set_marketing(boolean) to authenticated;

-- sign-up: the box "send me deal'ke news" (unticked by default) arrives as metadata marketing = true
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare yes boolean := coalesce((new.raw_user_meta_data->>'marketing')::boolean, false);
begin
  insert into public.profiles (id, email, marketing_opt_in, marketing_opt_in_at)
  values (new.id, new.email, yes, case when yes then now() end) on conflict do nothing;
  insert into public.user_data (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- ---------- site settings the admin controls (everyone may read them: the site needs them) ----------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);
alter table public.site_settings enable row level security;
drop policy if exists "everyone reads settings" on public.site_settings;
create policy "everyone reads settings" on public.site_settings for select using (true);
revoke insert, update, delete on public.site_settings from authenticated, anon;
grant select (key, value) on public.site_settings to anon, authenticated;

create or replace function public.admin_set_setting(k text, v jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform admin_need('admin');
  if k not in ('announcement', 'hidden_stores', 'hidden_deals', 'features', 'maintenance') then
    raise exception 'unknown_setting';
  end if;
  if length(v::text) > 60000 then raise exception 'too_big'; end if;
  insert into site_settings (key, value, updated_at, updated_by) values (k, v, now(), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  perform admin_note('setting_changed', jsonb_build_object('key', k));
end $$;

-- ---------- what the admin page reads ----------
-- Numbers only (any role): accounts, plans, opt-ins, visits.
create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
declare out jsonb;
begin
  perform admin_need('viewer');
  perform stats_rollup();
  select jsonb_build_object(
    'role', admin_role(),
    'users', (select count(*) from auth.users),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'users_30d', (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
    'opted_in', (select count(*) from profiles where marketing_opt_in),
    'single', (select count(*) from subscriptions where plan_type = 'single' and sub_live(status, current_period_end, grace_until)),
    'family', (select count(*) from subscriptions where plan_type = 'family' and sub_live(status, current_period_end, grace_until)),
    'family_people', (select count(*) from household_members m where m.status = 'active' and family_premium(m.household_id)),
    'past_due', (select count(*) from subscriptions where status in ('past_due', 'unpaid')),
    'canceling', (select count(*) from subscriptions where cancel_at_period_end and sub_live(status, current_period_end, grace_until)),
    'canceled_30d', (select count(*) from subscriptions where status = 'canceled' and updated_at > now() - interval '30 days'),
    'mrr', (select coalesce(sum(case plan_type when 'single' then 4.99 else 12.99 end), 0) from subscriptions
            where sub_live(status, current_period_end, grace_until)),
    'visits_today', (select count(distinct visit) from events where at >= date_trunc('day', now())),
    'visits_7d', (select count(distinct visit) from events where at > now() - interval '7 days'),
    'online_now', (select count(distinct visit) from events where at > now() - interval '5 minutes'),
    'signups_by_day', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date, 'n',
        (select count(*) from auth.users u where u.created_at >= d and u.created_at < d + interval '1 day')) order by d), '[]')
        from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') d)
  ) into out;
  return out;
end $$;

-- The anonymous report for the last `days` days (1-400), optionally for one store. Any role.
create or replace function public.admin_report(days int default 7, only_store text default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(days, 7), 400))); out jsonb;
begin
  perform admin_need('viewer');
  with e as (select * from events where at > since and (only_store is null or store = only_store or kind in ('view', 'search')))
  select jsonb_build_object(
    'since', since,
    'visits', (select count(distinct visit) from e),
    'events', (select count(*) from e),
    'stores', (select coalesce(jsonb_agg(x order by x.opens desc), '[]') from (
        select store, count(*) filter (where kind = 'open_deal') opens, count(*) filter (where kind = 'add_list') adds,
               count(*) filter (where kind = 'to_store') to_store, count(*) filter (where kind = 'directions') directions,
               count(*) filter (where kind = 'filter_store') filters, count(distinct visit) visits
        from e where store is not null group by store) x),
    -- the same per-shop numbers for the period before, to show the change (for partners)
    'prev_stores', (select coalesce(jsonb_agg(x), '[]') from (
        select store, count(*) filter (where kind = 'open_deal') opens, count(*) filter (where kind = 'add_list') adds,
               count(*) filter (where kind = 'to_store') to_store, count(*) filter (where kind = 'directions') directions,
               count(distinct visit) visits
        from events where at > since - (now() - since) and at <= since and store is not null
          and (only_store is null or store = only_store) group by store) x),
    'store_areas', (select coalesce(jsonb_agg(x), '[]') from (
        select store, area, count(distinct visit) visits from e where store is not null and area is not null group by 1, 2) x),
    'deals', (select coalesce(jsonb_agg(x order by x.opens + x.adds * 2 desc), '[]') from (
        select store, label, count(*) filter (where kind = 'open_deal') opens, count(*) filter (where kind = 'add_list') adds
        from e where kind in ('open_deal', 'add_list') and label is not null group by store, label
        order by count(*) filter (where kind = 'open_deal') + 2 * count(*) filter (where kind = 'add_list') desc limit 25) x),
    'searches', (select coalesce(jsonb_agg(x order by x.times desc), '[]') from (
        select lower(label) q, count(*) times, round(avg(n)) results from e where kind = 'search' and label is not null
        group by lower(label) order by count(*) desc limit 25) x),
    'no_results', (select coalesce(jsonb_agg(x order by x.times desc), '[]') from (
        select lower(label) q, count(*) times from e where kind = 'search' and n = 0 and label is not null
        group by lower(label) order by count(*) desc limit 25) x),
    'cats', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (
        select cat, count(*) n from e where cat is not null and kind in ('open_deal', 'add_list', 'filter_cat') group by cat) x),
    'pages', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (
        select label page, count(*) n from e where kind = 'view' group by label) x),
    'devices', (select coalesce(jsonb_object_agg(coalesce(device, '?'), n), '{}') from (
        select device, count(distinct visit) n from e group by device) x),
    'langs', (select coalesce(jsonb_object_agg(coalesce(lang, '?'), n), '{}') from (
        select lang, count(distinct visit) n from e group by lang) x),
    'areas', (select coalesce(jsonb_agg(x order by x.visits desc), '[]') from (
        select area, count(distinct visit) visits from e where area is not null group by area order by 2 desc limit 20) x),
    'by_day', (select coalesce(jsonb_agg(x order by x.day), '[]') from (
        select date_trunc('day', at)::date as day, count(distinct visit) visits, count(*) filter (where kind = 'open_deal') opens,
               count(*) filter (where kind = 'add_list') adds from e group by 1) x),
    'hours', (select coalesce(jsonb_agg(x order by x.h), '[]') from (
        select extract(hour from at at time zone 'Europe/Brussels')::int h, count(*) n from e group by 1) x),
    'weekdays', (select coalesce(jsonb_agg(x order by x.d), '[]') from (
        select extract(isodow from at at time zone 'Europe/Brussels')::int d, count(distinct visit) visits, count(*) n from e group by 1) x),
    'funnel', jsonb_build_object(
        'visits', (select count(distinct visit) from e),
        'opened', (select count(distinct visit) from e where kind = 'open_deal'),
        'added', (select count(distinct visit) from e where kind = 'add_list'),
        'to_store', (select count(distinct visit) from e where kind in ('to_store', 'directions')),
        'signup', (select count(distinct visit) from e where kind = 'signup'))
  ) into out;
  return out;
end $$;

-- Growth since the start, per month, from the daily totals (kept for good) and the accounts. Any role.
create or replace function public.admin_growth() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform admin_need('viewer');
  perform stats_rollup();
  return coalesce((select jsonb_agg(x order by x.month) from (
    select m::date as month,
      (select coalesce(sum(visits), 0) from stats_daily_site where day >= m and day < m + interval '1 month') visit_days,
      (select coalesce(sum(events), 0) from stats_daily where kind = 'open_deal' and day >= m and day < m + interval '1 month') opens,
      (select coalesce(sum(events), 0) from stats_daily where kind = 'add_list' and day >= m and day < m + interval '1 month') adds,
      (select coalesce(sum(events), 0) from stats_daily where kind in ('to_store', 'directions') and day >= m and day < m + interval '1 month') sent,
      (select count(*) from auth.users where created_at >= m and created_at < m + interval '1 month') new_accounts,
      (select count(*) from auth.users where created_at < m + interval '1 month') accounts,
      (select count(*) from subscriptions where created_at >= m and created_at < m + interval '1 month') new_premium
    from generate_series(date_trunc('month', least(coalesce((select min(day) from stats_daily_site), now()::date),
                                                   coalesce((select min(created_at) from auth.users)::date, now()::date))),
                         date_trunc('month', now()), interval '1 month') m) x), '[]');
end $$;

-- Right now: the last 30 minutes, as an anonymous feed (what was done, never by whom). Any role.
create or replace function public.admin_live() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  perform admin_need('viewer');
  return jsonb_build_object(
    'online', (select count(distinct visit) from events where at > now() - interval '5 minutes'),
    'feed', (select coalesce(jsonb_agg(x order by x.at desc), '[]') from (
        select at, kind, store, label, device from events where at > now() - interval '30 minutes' order by at desc limit 40) x));
end $$;

-- What account holders chose in their settings, as totals (never per person). Any role.
create or replace function public.admin_prefs() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  perform admin_need('viewer');
  return jsonb_build_object(
    'shops', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (
        select prefs->>'shop' shop, count(*) n from user_data where coalesce(prefs->>'shop', '') <> '' group by 1) x),
    'diets', (select coalesce(jsonb_agg(x order by x.n desc), '[]') from (
        select d diet, count(*) n from user_data, jsonb_array_elements_text(case when jsonb_typeof(prefs->'diet') = 'array' then prefs->'diet' else '[]' end) d group by d) x),
    'langs', (select coalesce(jsonb_object_agg(l, n), '{}') from (
        select coalesce(prefs->>'lang', '?') l, count(*) n from user_data group by 1) x),
    'radius', (select coalesce(jsonb_agg(x order by x.km), '[]') from (
        select (prefs->>'radius') km, count(*) n from user_data where prefs->>'radius' ~ '^\d+$' group by 1) x),
    'with_list', (select count(*) from user_data where jsonb_typeof(prefs->'wants') = 'array' and jsonb_array_length(prefs->'wants') > 0),
    'avg_list', (select round(avg(jsonb_array_length(prefs->'wants')), 1) from user_data where jsonb_typeof(prefs->'wants') = 'array' and jsonb_array_length(prefs->'wants') > 0),
    'with_recipes', (select count(*) from user_data where jsonb_typeof(recipes) = 'array' and jsonb_array_length(recipes) > 0),
    'push_on', (select count(*) from user_data where jsonb_typeof(prefs->'push') = 'array' and jsonb_array_length(prefs->'push') > 0),
    'families', (select count(*) from households where status = 'active'));
end $$;

-- The account list (admin and owner). Looking is logged.
create or replace function public.admin_users(search text default null, lim int default 50, skip int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare out jsonb;
begin
  perform admin_need('admin');
  perform admin_note('viewed_users', jsonb_build_object('search', search));
  with u as (
    select u.id, u.email, u.created_at, u.last_sign_in_at, coalesce(p.marketing_opt_in, false) opt_in,
           (select s.plan_type || ':' || s.status from subscriptions s where (s.user_id = u.id or s.payer_id = u.id) order by s.updated_at desc limit 1) sub,
           has_premium(u.id) premium, (select role from admins a where a.user_id = u.id) admin
    from auth.users u left join profiles p on p.id = u.id
    where search is null or search = '' or u.email ilike '%' || search || '%')
  select jsonb_build_object('total', (select count(*) from u),
    'rows', coalesce((select jsonb_agg(x) from (select * from u order by created_at desc nulls last
        limit greatest(1, least(coalesce(lim, 50), 500)) offset greatest(0, coalesce(skip, 0))) x), '[]')) into out;
  return out;
end $$;

-- The email list: ONLY people who said yes (admin and owner). Downloading is logged.
create or replace function public.admin_mailing_list() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform admin_need('admin');
  perform admin_note('exported_email_list', jsonb_build_object('count', (select count(*) from profiles where marketing_opt_in)));
  return coalesce((select jsonb_agg(x order by x.since) from (
    select p.email, p.marketing_opt_in_at since, d.prefs->>'lang' lang, d.prefs->>'pc' postcode
    from profiles p left join user_data d on d.user_id = p.id where p.marketing_opt_in and p.email is not null) x), '[]');
end $$;

-- The people who may enter, and the log (owner sees the team; admin and owner see the log)
create or replace function public.admin_team() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  perform admin_need('owner');
  return coalesce((select jsonb_agg(x order by x.granted_at) from (
    select a.user_id, a.email, a.role, a.granted_at, (select email from admins g where g.user_id = a.granted_by) granted_by from admins a) x), '[]');
end $$;

create or replace function public.admin_grant(who_email text, new_role text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  perform admin_need('owner');
  if new_role not in ('owner', 'admin', 'viewer') then raise exception 'bad_role'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(who_email));
  if uid is null then return 'no_account'; end if;           -- they have to make an account on the site first
  if uid = auth.uid() and new_role <> 'owner' and (select count(*) from admins where role = 'owner') = 1 then return 'last_owner'; end if;
  insert into admins (user_id, email, role, granted_by) values (uid, (select email from auth.users where id = uid), new_role, auth.uid())
  on conflict (user_id) do update set role = excluded.role, granted_by = auth.uid(), granted_at = now();
  perform admin_note('access_granted', jsonb_build_object('email', who_email, 'role', new_role));
  return 'ok';
end $$;

create or replace function public.admin_revoke(who uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  perform admin_need('owner');
  if (select role from admins where user_id = who) = 'owner' and (select count(*) from admins where role = 'owner') = 1 then return 'last_owner'; end if;
  perform admin_note('access_removed', jsonb_build_object('email', (select email from admins where user_id = who)));
  delete from admins where user_id = who;
  return 'ok';
end $$;

-- Invitation links for coworkers: the owner makes one, the coworker opens it and signs in (or makes an account), done.
-- Miro's choice: a link keeps working (for several coworkers) until the owner switches it off. Everyone who joined
-- shows in the team list and can be removed there. Only a hash of the link is stored, so the table can't be used to get in.
create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  role text not null check (role in ('owner', 'admin', 'viewer')),
  note text,
  created_by uuid references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,                  -- null: until switched off
  uses int not null default 0,
  last_used_at timestamptz
);
alter table public.admin_invites enable row level security;
revoke all on public.admin_invites from authenticated, anon;

create or replace function public.admin_invite_create(new_role text default 'admin', who text default null) returns text
language plpgsql security definer set search_path = public as $$
declare tok text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');   -- 244 random bits
begin
  perform admin_need('owner');
  if new_role not in ('owner', 'admin', 'viewer') then raise exception 'bad_role'; end if;
  insert into admin_invites (token_hash, role, note, created_by) values (encode(sha256(convert_to(tok, 'UTF8')), 'hex'), new_role, left(who, 80), auth.uid());
  perform admin_note('invite_link_made', jsonb_build_object('role', new_role, 'for', left(who, 80)));
  return tok;
end $$;

create or replace function public.admin_invites() returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  perform admin_need('owner');
  return coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select id, role, note, created_at, expires_at, uses, last_used_at from admin_invites where expires_at is null or expires_at > now()) x), '[]');
end $$;

create or replace function public.admin_invite_cancel(inv uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform admin_need('owner');
  delete from admin_invites where id = inv;
  perform admin_note('invite_link_switched_off', '{}'::jsonb);
end $$;

-- the coworker, signed in, opens the link: ok, invalid, used or expired
create or replace function public.admin_invite_accept(token text) returns text
language plpgsql security definer set search_path = public as $$
declare i admin_invites;
begin
  if auth.uid() is null then return 'sign_in'; end if;
  select * into i from admin_invites where token_hash = encode(sha256(convert_to(coalesce(token, ''), 'UTF8')), 'hex') for update;
  if i.id is null then return 'invalid'; end if;                -- never made, or switched off
  if i.expires_at < now() then return 'expired'; end if;
  if exists (select 1 from admins where user_id = auth.uid()) and (select role from admins where user_id = auth.uid()) = i.role then return 'ok'; end if;
  update admin_invites set uses = uses + 1, last_used_at = now() where id = i.id;
  insert into admins (user_id, email, role, granted_by) values (auth.uid(), (select email from auth.users where id = auth.uid()), i.role, i.created_by)
  on conflict (user_id) do update set role = case when admins.role = 'owner' then 'owner' else excluded.role end;
  insert into admin_log (actor, actor_email, action, detail)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), 'joined_by_link', jsonb_build_object('role', i.role, 'for', i.note));
  return 'ok';
end $$;

create or replace function public.admin_log_list(lim int default 100) returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
  perform admin_need('admin');
  return coalesce((select jsonb_agg(x order by x.at desc) from (
    select at, actor_email, action, detail from admin_log order by at desc limit greatest(1, least(coalesce(lim, 100), 1000))) x), '[]');
end $$;

grant execute on function public.admin_role(), public.admin_overview(), public.admin_growth(), public.admin_report(int, text), public.admin_live(),
  public.admin_prefs(), public.admin_users(text, int, int), public.admin_mailing_list(), public.admin_team(),
  public.admin_grant(text, text), public.admin_revoke(uuid), public.admin_log_list(int), public.admin_set_setting(text, jsonb),
  public.admin_invite_create(text, text), public.admin_invites(), public.admin_invite_cancel(uuid), public.admin_invite_accept(text)
  to authenticated;
revoke execute on function public.admin_overview(), public.admin_growth(), public.admin_report(int, text), public.admin_live(), public.admin_prefs(),
  public.admin_users(text, int, int), public.admin_mailing_list(), public.admin_team(), public.admin_grant(text, text),
  public.admin_revoke(uuid), public.admin_log_list(int), public.admin_set_setting(text, jsonb),
  public.admin_invite_create(text, text), public.admin_invites(), public.admin_invite_cancel(uuid), public.admin_invite_accept(text) from anon, public;
