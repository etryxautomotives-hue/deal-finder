-- Database tests for the admin back end (supabase/migrations/005_admin.sql). Runs after premium.test.sql (uses its t.* helpers).
\set ON_ERROR_STOP on
set client_min_messages = warning;
\o /dev/null
reset role;
truncate t.results;
insert into t.users values ('boss', gen_random_uuid()), ('helper', gen_random_uuid()), ('looker', gen_random_uuid()), ('nobody', gen_random_uuid()),
  ('newsy', gen_random_uuid()), ('quiet', gen_random_uuid());
insert into auth.users (id, email, raw_user_meta_data) select id, name || '@x.be', '{}' from t.users where name in ('boss', 'helper', 'looker', 'nobody', 'quiet');
insert into auth.users (id, email, raw_user_meta_data) select id, 'newsy@x.be', '{"marketing": true}' from t.users where name = 'newsy';
-- Miro's one manual step after the migration
insert into public.admins (user_id, email, role) select id, 'boss@x.be', 'owner' from t.users where name = 'boss';

-- ===== 1. strangers get nothing =====
set role anon; select t.as('');
select t.err('select public.admin_overview()', 'permission denied|not_admin', '1 a visitor cannot read the overview');
select t.err('select * from public.events', 'permission denied', '1 a visitor cannot read events');
select t.err('select * from public.admins', 'permission denied', '1 a visitor cannot read who is admin');
select t.err('insert into public.site_settings values (''announcement'', ''{}'')', 'permission denied', '1 a visitor cannot change settings');
set role authenticated; select t.as('nobody');
select t.ok(public.admin_role() is null, '1 a normal account has no admin role');
select t.err('select public.admin_overview()', 'not_admin', '1 a normal account cannot read the overview');
select t.err('select public.admin_report(7)', 'not_admin', '1 a normal account cannot read the report');
select t.err('select public.admin_users()', 'not_admin', '1 a normal account cannot read the user list');
select t.err('select public.admin_mailing_list()', 'not_admin', '1 a normal account cannot read the email list');
select t.err('select public.admin_grant(''nobody@x.be'', ''owner'')', 'not_admin', '1 a normal account cannot make itself admin');
select t.err('insert into public.admins values (auth.uid(), ''nobody@x.be'', ''owner'')', 'permission denied', '1 nor by writing the table');
select t.err('select public.admin_set_setting(''announcement'', ''{"on":true}'')', 'not_admin', '1 a normal account cannot change settings');
select t.err('select * from public.admin_log', 'permission denied', '1 a normal account cannot read the log');
select t.err('select public.admin_need(''viewer'')', 'permission denied', '1 the helper functions are closed');

-- ===== 2. anonymous statistics =====
set role anon;
select t.ok(public.track('[{"visit":"abc12345","kind":"open_deal","store":"Aldi","cat":"dairy","label":"Melk","lang":"nl","device":"phone","area":"90"},
  {"visit":"abc12345","kind":"add_list","store":"Aldi","label":"Melk"},{"visit":"abc12345","kind":"search","label":"Koffie","n":"0"},
  {"visit":"abc12345","kind":"hack","label":"x"}]') = 3, '2 a visitor can send events, unknown kinds are dropped');
select t.ok(public.track('[{"visit":"BAD ID!","kind":"view"}]') = 0, '2 a bad visit id is refused');
select t.ok(public.track('{"visit":"abc12345"}') = 0, '2 something that is not a list is refused');
select t.ok(public.track('[{"visit":"zzz12345","kind":"open_deal","store":"Lidl","label":"Kaas","area":"9000","device":"fridge"}]') = 1, '2 a second visit');
reset role;
select t.ok((select area is null and device is null from public.events where visit = 'zzz12345'), '2 a full postcode or odd device is not kept');
select t.ok((select count(*) = 0 from information_schema.columns where table_name = 'events' and column_name in ('user_id', 'email', 'ip')), '2 events have no account, email or IP column');

-- ===== 3. owner: everything =====
set role authenticated; select t.as('boss');
select t.ok(public.admin_role() = 'owner', '3 the owner is owner');
select t.ok((public.admin_overview()->>'users')::int >= 6, '3 overview counts accounts');
select t.ok((public.admin_overview()->>'opted_in')::int = 1, '3 only the one who ticked the box is on the email list');
select t.ok((public.admin_report(7)->>'visits')::int = 2, '3 report counts visits');
select t.ok(public.admin_report(7)->'stores'->0->>'store' = 'Aldi' and (public.admin_report(7)->'stores'->0->>'adds')::int = 1, '3 report per store');
select t.ok(public.admin_report(7)->'no_results'->0->>'q' = 'koffie', '3 searches without results are listed');
select t.ok((public.admin_report(7, 'Lidl')->'stores'->0->>'store') = 'Lidl' and jsonb_array_length(public.admin_report(7, 'Lidl')->'stores') = 1, '3 report for one store');
select t.ok((public.admin_live()->>'online')::int = 2, '3 live: who is on the site now (as a number)');
select t.ok(jsonb_typeof(public.admin_prefs()->'shops') = 'array', '3 preferences as totals');
select t.ok(jsonb_array_length(public.admin_mailing_list()) = 1 and public.admin_mailing_list()->0->>'email' = 'newsy@x.be', '3 email list = only opt-ins');
select t.ok((public.admin_users('x.be')->>'total')::int >= 6, '3 user list');
select t.ok(public.admin_grant('helper@x.be', 'admin') = 'ok' and public.admin_grant('looker@x.be', 'viewer') = 'ok', '3 owner grants access');
select t.ok(public.admin_grant('stranger@x.be', 'admin') = 'no_account', '3 granting someone without an account says so');
select t.ok(public.admin_grant('boss@x.be', 'viewer') = 'last_owner', '3 the last owner cannot demote themselves');
select t.ok(jsonb_array_length(public.admin_team()) = 3, '3 team list');
select public.admin_set_setting('announcement', '{"on":true,"nl":"Hallo"}');
select t.err('select public.admin_set_setting(''password'', ''"x"'')', 'unknown_setting', '3 only known settings');

-- ===== 4. everyone reads the settings =====
set role anon;
select t.ok((select value->>'nl' from public.site_settings where key = 'announcement') = 'Hallo', '4 the site reads the announcement');

-- ===== 5. admin: no team =====
set role authenticated; select t.as('helper');
select t.ok(jsonb_array_length(public.admin_mailing_list()) = 1, '5 admin reads the email list');
select public.admin_set_setting('hidden_stores', '["Lidl"]');
select t.err('select public.admin_team()', 'needs_owner', '5 admin cannot see the team');
select t.err('select public.admin_grant(''nobody@x.be'', ''owner'')', 'needs_owner', '5 admin cannot grant access');

-- ===== 6. viewer: anonymous numbers only =====
set role authenticated; select t.as('looker');
select t.ok((public.admin_report(7)->>'visits')::int = 2, '6 viewer reads the report');
select t.ok(public.admin_overview() is not null, '6 viewer reads the overview');
select t.err('select public.admin_users()', 'needs_admin', '6 viewer cannot see the user list');
select t.err('select public.admin_mailing_list()', 'needs_admin', '6 viewer cannot see emails');
select t.err('select public.admin_set_setting(''announcement'', ''{}'')', 'needs_admin', '6 viewer cannot change the site');

-- ===== 7. saying yes / no to the email list =====
set role authenticated; select t.as('quiet');
select t.ok(public.set_marketing(true), '7 a person can say yes');
select t.as('newsy');
select t.ok(not public.set_marketing(false), '7 and no');
update public.profiles set marketing_opt_in = true where id = t.uid('nobody');
reset role; select t.ok(not (select marketing_opt_in from public.profiles where id = t.uid('nobody')), '7 nobody can tick it for someone else');
set role authenticated;
select t.as('boss');
select t.ok(jsonb_array_length(public.admin_mailing_list()) = 1 and public.admin_mailing_list()->0->>'email' = 'quiet@x.be', '7 the list follows');

-- ===== 8. the log, and taking access away =====
select t.ok((select count(*) from jsonb_array_elements(public.admin_log_list()) x where x->>'action' = 'exported_email_list') >= 2, '8 email exports are logged');
select t.ok(public.admin_revoke(t.uid('helper')) = 'ok', '8 owner removes access');
select t.as('helper');
select t.err('select public.admin_overview()', 'not_admin', '8 and it is gone');

-- ===== 9. invitation links for coworkers =====
select t.as('boss');
insert into t.tok values ('coworker', public.admin_invite_create('admin', 'Lotte from sales')) on conflict (name) do update set tok = excluded.tok;
select t.ok(jsonb_array_length(public.admin_invites()) = 1, '9 the owner sees the open link');
select t.as('looker');
select t.err('select public.admin_invite_create(''admin'')', 'needs_owner', '9 only the owner makes links');
select t.as('nobody');
select t.ok(public.admin_invite_accept('wrong') = 'invalid', '9 a made-up link does nothing');
select t.ok(public.admin_invite_accept((select tok from t.tok where name = 'coworker')) = 'ok', '9 a coworker opens the link and is in');
select t.ok(public.admin_role() = 'admin' and (public.admin_users()->>'total')::int >= 6, '9 and sees everything');
select t.as('quiet');
select t.ok(public.admin_invite_accept((select tok from t.tok where name = 'coworker')) = 'ok', '9 the link works for a second coworker too');
select t.ok(public.admin_role() = 'admin', '9 and they are in');
select t.as('boss');
select t.ok((public.admin_invites()->0->>'uses')::int = 2, '9 the owner sees how often the link was used');
select public.admin_invite_cancel((public.admin_invites()->0->>'id')::uuid);
select t.as('newsy');
select t.ok(public.admin_invite_accept((select tok from t.tok where name = 'coworker')) = 'invalid', '9 a switched-off link lets nobody in');
select t.ok(public.admin_role() is null, '9 so they are not in');
select t.as('boss');
select t.ok(public.admin_revoke(t.uid('quiet')) = 'ok', '9 the owner removes a coworker');

-- ===== 10. daily totals are kept when the raw data goes =====
reset role;
insert into public.events (at, visit, kind, store) values (now() - interval '14 months', 'old12345', 'to_store', 'Aldi'), (now() - interval '14 months', 'old12345', 'open_deal', 'Aldi');
select public.stats_rollup();
delete from public.events where at < now() - interval '13 months';
select t.ok((select count(*) = 0 from public.events where visit = 'old12345'), '10 raw events older than 13 months are gone');
select t.ok((select events = 1 from public.stats_daily where store = 'Aldi' and kind = 'to_store' and day < now() - interval '13 months'), '10 their daily totals stay');
set role authenticated; select t.as('boss');
select t.ok((select sum((x->>'sent')::int) from jsonb_array_elements(public.admin_growth()) x) >= 1, '10 growth per month reads the totals');
select t.ok(jsonb_array_length(public.admin_growth()) >= 14, '10 growth goes back to the first month');
set role anon;
select t.err('select * from public.stats_daily', 'permission denied', '10 visitors cannot read the totals');
select t.err('select public.stats_rollup()', 'permission denied', '10 nor run the roll-up');
set role authenticated;

-- ===== summary =====
\o
reset role;
select n, case when ok then 'ok  ' else 'FAIL' end as r, name, coalesce(detail, '') as detail from t.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from t.results \gset
\echo :passed passed, :failed failed
select (:failed = 0) as all_passed \gset
\if :all_passed
\else
  \echo 'ADMIN DATABASE TESTS FAILED'
  select 1/0;
\endif
