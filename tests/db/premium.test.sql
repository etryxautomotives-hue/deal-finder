-- Database tests for Single & Family Premium (supabase/migrations/004_premium_families.sql).
-- Several made-up accounts sign in one after the other (set request.uid) and try everything allowed and not allowed.
-- Each check writes a row to t.results; the summary at the end fails the run if one check failed.
\set ON_ERROR_STOP on
set client_min_messages = warning;
\o /dev/null
create schema t;
grant usage on schema t to authenticated, anon, service_role;
create table t.results (n serial primary key, name text, ok boolean, detail text);
create table t.users (name text primary key, id uuid);
create table t.tok (name text primary key, tok text);
grant select, insert, update on t.results, t.users, t.tok to authenticated, anon, service_role;
grant usage on sequence t.results_n_seq to authenticated, anon, service_role;

create function t.ok(cond boolean, name text, detail text default null) returns void language sql as
  $$ insert into t.results (name, ok, detail) values (name, coalesce(cond, false), detail) $$;
-- the statement must fail with an error matching pat
create function t.err(q text, pat text, name text) returns void language plpgsql as $$
begin
  execute q;
  insert into t.results (name, ok, detail) values (name, false, 'no error');
exception when others then
  insert into t.results (name, ok, detail) values (name, sqlerrm ~* pat, sqlerrm);
end $$;
create function t.uid(n text) returns uuid language sql stable as $$ select id from t.users where name = n $$;
create function t.as(n text) returns void language sql as $$ select set_config('request.uid', coalesce(t.uid(n)::text, ''), false) $$;
create function t.invite(n text, email text) returns void language sql as
  $$ insert into t.tok values (n, public.create_invitation(email)) on conflict (name) do update set tok = excluded.tok $$;
create function t.accept(n text) returns uuid language sql as
  $$ select public.accept_invitation((select tok from t.tok where name = n), n, 'a:fox') $$;
-- one Stripe event as the webhook would hand it over (period end in days from now)
create function t.wh(ev text, typ text, sub text, payer text, plan text, st text, days int default 30,
                     inv text default null, cancel boolean default false, state_at bigint default null) returns text language sql as $$
  select public.stripe_apply(jsonb_build_object('event_id', ev, 'type', typ, 'subscription', sub, 'customer', 'cus_' || payer,
    'payer', t.uid(payer), 'plan', plan, 'status', st, 'period_start', extract(epoch from now())::bigint,
    'period_end', extract(epoch from now() + make_interval(days => days))::bigint, 'cancel_at_period_end', cancel,
    'invoice', inv, 'state_at', coalesce(state_at, extract(epoch from clock_timestamp())::bigint)))
$$;

-- the people
insert into t.users values ('owner', '00000000-0000-0000-0000-000000000001'), ('ann', '00000000-0000-0000-0000-000000000002'),
  ('ben', '00000000-0000-0000-0000-000000000003'), ('cas', '00000000-0000-0000-0000-000000000004'),
  ('dirk', '00000000-0000-0000-0000-000000000005'), ('eva', '00000000-0000-0000-0000-000000000006'),
  ('fien', '00000000-0000-0000-0000-000000000007'), ('gust', '00000000-0000-0000-0000-000000000008'),
  ('solo', '00000000-0000-0000-0000-000000000009'), ('free', '00000000-0000-0000-0000-00000000000a'),
  ('other', '00000000-0000-0000-0000-00000000000b'), ('hans', '00000000-0000-0000-0000-00000000000c');
insert into auth.users select id, name || '@x.be' from t.users;
update public.profiles p set stripe_customer_id = 'cus_' || u.name from t.users u where u.id = p.id;

-- ===== 1. a free account =====
set role authenticated;
select t.as('free');
select t.ok((public.my_plan()->>'premium')::boolean = false and public.my_plan()->>'plan' = 'free', '01 free account: no Premium');
select t.err($$select public.create_invitation('x@x.be')$$, 'only the owner', '01 free account cannot invite');
select t.ok(public.checkout_check('single') = 'new' and public.checkout_check('family') = 'new', '01 free account may buy either plan');
select t.ok((select count(*) from public.household_items) = 0, '01 free account sees no family list');

-- ===== 2. browser tampering: nobody gives themselves Premium =====
select t.err($$insert into public.subscriptions (plan_type, user_id, payer_id, stripe_customer_id, stripe_subscription_id, status) values ('single', auth.uid(), auth.uid(), 'cus_free', 'sub_fake', 'active')$$, 'permission denied', '02 cannot insert own subscription');
select t.err($$select public.stripe_apply('{"event_id":"evil","type":"customer.subscription.updated","subscription":"sub_fake","plan":"single","status":"active"}'::jsonb)$$, 'permission denied', '02 cannot call the webhook function');
select t.err($$select * from public.stripe_events$$, 'permission denied', '02 cannot read webhook log');
select t.err($$insert into public.households (name, owner) values ('Fake', auth.uid())$$, 'permission denied', '02 cannot make a family without paying');
select t.err($$insert into public.household_members (household_id, user_id, role) select id, auth.uid(), 'owner' from public.households limit 1$$, 'permission denied', '02 cannot add self to a family');
update public.profiles set subscription_status = 'active';
select t.ok((select subscription_status from public.profiles where id = auth.uid()) is null, '02 cannot change own profile plan');
select t.ok(not public.has_premium(auth.uid()), '02 still no Premium after all that');

-- ===== 3. Single Premium =====
select t.as('solo');
select t.ok(not public.has_premium(auth.uid()), '03 redirect alone gives nothing: no Premium before Stripe confirms');
reset role; set role service_role;
select t.ok(t.wh('ev_s1', 'checkout.session.completed', 'sub_solo', 'solo', 'single', 'incomplete') = 'ok', '03 checkout completed (payment not yet through)');
set role authenticated; select t.as('solo');
select t.ok(not public.has_premium(auth.uid()), '03 incomplete payment: still no Premium');
reset role; set role service_role;
select t.ok(t.wh('ev_s2', 'invoice.paid', 'sub_solo', 'solo', 'single', 'active', 30, 'paid') = 'ok', '03 invoice paid');
select t.ok(t.wh('ev_s2', 'invoice.paid', 'sub_solo', 'solo', 'single', 'active', 30, 'paid') = 'duplicate', '03 same webhook twice is applied once');
select t.ok((select count(*) from public.subscriptions where stripe_subscription_id = 'sub_solo') = 1, '03 one subscription row');
set role authenticated; select t.as('solo');
select t.ok(public.has_premium(auth.uid()) and public.my_plan()->>'plan' = 'single', '03 Single is Premium after Stripe confirms');
select t.err($$select public.create_invitation('ann@x.be')$$, 'only the owner', '03 Single cannot be shared (no invitations)');
select t.ok(public.checkout_check('single') = 'already single', '03 no second Single');
select t.ok(public.checkout_check('family') = 'switch:sub_solo', '03 Single -> Family switches the same subscription (no double billing)');
select t.as('free');
select t.ok((select count(*) from public.subscriptions) = 0, '03 others cannot see someone''s subscription');

-- ===== 4. Family Premium: buying creates the family, owner and link =====
select t.as('owner');
reset role; set role service_role;
select t.ok(t.wh('ev_o1', 'checkout.session.completed', 'sub_fam', 'owner', 'family', 'active') = 'ok', '04 family checkout confirmed by Stripe');
reset role;
select t.ok((select count(*) from public.households where owner = t.uid('owner')) = 1, '04 family created');
select t.ok((select role from public.household_members where user_id = t.uid('owner')) = 'owner', '04 owner membership created');
select t.ok((select s.family_id = h.id and s.user_id is null from public.subscriptions s join public.households h on h.subscription_id = s.id where s.stripe_subscription_id = 'sub_fam'), '04 subscription belongs to the family, not a person');
select id as fam from public.households where owner = t.uid('owner') \gset
set role authenticated; select t.as('owner');
select t.ok(public.has_premium(auth.uid()) and public.my_plan()->>'plan' = 'family' and public.my_plan()->'family'->>'role' = 'owner', '04 owner has Family Premium');
select t.ok(public.checkout_check('family') = 'already family' and public.checkout_check('single') = 'switch:sub_fam', '04 no second Family; owner alone may switch to Single');
select public.rename_family('De Peeters');
select t.ok((select name from public.households) = 'De Peeters', '04 owner renames the family');
select t.err($$update public.households set subscription_id = null$$, 'permission denied', '04 owner cannot unlink the subscription by hand');
select t.err($$update public.households set max_members = 50$$, 'permission denied', '04 owner cannot raise the member limit');
select t.err($$update public.household_members set role = 'member', status = 'removed' where user_id = auth.uid()$$, 'permission denied', '04 roles and status cannot be changed by hand');

-- ===== 5. invitations =====
select t.err($$select public.create_invitation('owner@x.be')$$, 'that is you', '05 cannot invite yourself');
select t.err($$select public.create_invitation('not-an-email')$$, 'bad email', '05 email is checked');
select t.invite('ann', 'Ann@X.be'); select t.invite('ben', 'ben@x.be'); select t.invite('cas', 'cas@x.be'); select t.invite('dirk', 'dirk@x.be');
select t.ok((select count(*) from public.family_invitations where status = 'pending') = 4, '05 owner sees four pending invitations');
select t.ok((select bool_and(length(token_hash) = 64 and token_hash <> (select tok from t.tok where name = 'ann')) from public.family_invitations), '05 only the hash of the token is stored');
select t.err($$select public.create_invitation('eva@x.be')$$, 'family full', '05 a fifth invitation is refused (owner + 4 = 5)');
select t.ok((select expires_at between now() + interval '47 hours' and now() + interval '49 hours' from public.family_invitations where invited_email = 'ann@x.be'), '05 invitations last 48 hours');

select t.as('ben');
select t.ok((public.invitation_info((select tok from t.tok where name = 'ann'))->>'reason') = 'other_email', '05 a link shows nothing to the wrong account');
select t.err($$select t.accept('ann')$$, 'another email', '05 a forwarded link does not work for someone else');
select t.ok(not public.is_member(:'fam'), '05 ... and they did not get in');
select t.err($$select public.accept_invitation('made-up-token')$$, 'unknown', '05 a guessed token does not work');
select t.as('ann');
select t.ok((public.invitation_info((select tok from t.tok where name = 'ann'))->>'family') = 'De Peeters', '05 the invited person sees which family');
select t.ok(t.accept('ann') = :'fam'::uuid, '05 existing account accepts without a new account');
select t.ok(t.accept('ann') = :'fam'::uuid and (select count(*) from public.household_members where household_id = :'fam') = 2, '05 accepting twice changes nothing');
select t.ok(public.has_premium(auth.uid()) and public.my_plan()->>'plan' = 'family_member', '05 member gets Premium through the family');
select t.ok(not (public.my_plan() ? 'period_end') and not (public.my_plan() ? 'payment'), '05 member sees no payment details');
select t.ok((select count(*) from public.subscriptions) = 0, '05 member cannot read the subscription');
select t.err($$select public.create_invitation('eva@x.be')$$, 'only the owner', '05 members cannot invite');
select t.err($$select public.remove_member(t.uid('owner'))$$, 'only the owner', '05 members cannot remove anyone');
select t.err($$select public.rename_family('Hacked')$$, 'only the owner', '05 members cannot change family settings');
select t.ok(public.checkout_check('single') like 'member:%', '05 a member must leave before buying Single');
select t.ok(public.checkout_check('family') like 'member:%', '05 a member cannot buy a second family');
select t.err($$update public.household_members set role = 'owner' where user_id = auth.uid()$$, 'permission denied', '05 members cannot make themselves owner');
update public.household_members set name = 'Annie' where user_id = auth.uid();
select t.ok((select name from public.household_members where user_id = auth.uid()) = 'Annie', '05 members change their own name');
update public.household_members set name = 'Hacked' where user_id = t.uid('owner');
select t.ok((select name from public.household_members where user_id = t.uid('owner')) is distinct from 'Hacked', '05 ... but not someone else''s');

-- the token cannot be used again by anyone
select t.as('dirk');
select t.err($$select public.accept_invitation((select tok from t.tok where name = 'ann'))$$, 'accepted', '05 a used invitation cannot be used again');
-- expired
reset role; update public.family_invitations set expires_at = now() - interval '1 minute' where invited_email = 'dirk@x.be';
set role authenticated; select t.as('dirk');
select t.err($$select t.accept('dirk')$$, 'expired', '05 an expired invitation does not work');
-- revoked
select t.as('owner');
select public.revoke_invitation((select id from public.family_invitations where invited_email = 'cas@x.be'));
select t.as('cas');
select t.err($$select t.accept('cas')$$, 'revoked', '05 a cancelled invitation does not work');
select t.err($$select public.revoke_invitation((select id from public.family_invitations limit 1))$$, 'not allowed', '05 only the owner cancels invitations');
-- a Single subscriber must cancel Single first
select t.as('owner'); select t.invite('solo', 'solo@x.be');
select t.as('solo');
select t.err($$select t.accept('solo')$$, 'cancel single first', '05 someone paying Single cannot join without cancelling (no double pay)');

-- ===== 6. the shared list =====
select t.as('owner');
insert into public.household_items (household_id, q, qty) values (:'fam', 'koffie', 2);
select t.as('ann');
select t.ok((select count(*) from public.household_items where q = 'koffie') = 1, '06 a member sees the owner''s item');
insert into public.household_items (household_id, q) values (:'fam', 'melk');
update public.household_items set done_by = t.uid('owner'), qty = 3 where q = 'koffie';   -- tries to tick in the owner's name
select t.ok((select done_by = t.uid('ann') and done_at is not null and qty = 3 and updated_by = t.uid('ann') from public.household_items where q = 'koffie'), '06 a tick is always in your own name, with who and when');
select t.ok((select added_by = t.uid('ann') from public.household_items where q = 'melk'), '06 who added it is filled in by the database');
select t.err($$update public.household_items set household_id = gen_random_uuid() where q = 'melk'$$, 'permission denied', '06 an item cannot be moved to another family');
select t.err($$insert into public.household_items (household_id, q, added_by) values ('$$ || :'fam' || $$', 'x', t.uid('owner'))$$, 'permission denied', '06 cannot add in someone else''s name');
update public.household_items set cleared_at = now() where q = 'koffie';
select t.ok((select cleared_at is not null from public.household_items where q = 'koffie'), '06 clearing bought items keeps them (for savings)');
insert into public.family_deals (household_id, deal_id, data) values (:'fam', 'aldi-123', '{"name":"Koffie 1kg","price":7.99}');
select t.as('owner');
select t.ok((select count(*) from public.family_deals) = 1, '06 a shared deal is seen by the family');
select t.ok((select count(*) from public.user_data where user_id = t.uid('ann')) = 0, '06 a member''s personal list stays private');
select t.ok((select count(*) from public.family_activity where action in ('item_added', 'item_bought', 'member_joined', 'deal_shared')) >= 5, '06 activity is logged');

-- ===== 7. another family cannot see or touch this one =====
reset role; set role service_role;
select t.ok(t.wh('ev_x1', 'checkout.session.completed', 'sub_other', 'other', 'family', 'active') = 'ok', '07 a second family');
set role authenticated; select t.as('other');
select t.ok((select count(*) from public.household_items) = 0 and (select count(*) from public.family_deals) = 0, '07 other family sees nothing of ours');
select t.ok((select count(*) from public.household_members where household_id = :'fam') = 0, '07 other family does not see our members');
select t.err($$insert into public.household_items (household_id, q) values ('$$ || :'fam' || $$', 'spam')$$, 'row-level security', '07 other family cannot add to our list');
update public.household_items set qty = 99 where household_id = :'fam';
delete from public.household_items where household_id = :'fam';
reset role;
select t.ok((select count(*) from public.household_items where household_id = :'fam') = 2 and (select max(qty) from public.household_items where household_id = :'fam') = 3, '07 other family changed and deleted nothing');
set role anon; select t.as('');
select t.ok((select count(*) from public.household_items) = 0 and (select count(*) from public.households) = 0, '07 signed-out visitors see nothing');

-- ===== 8. the sixth person =====
set role authenticated; select t.as('owner');
select public.revoke_invitation((select id from public.family_invitations where invited_email = 'solo@x.be' and status = 'pending'));
select t.invite('ben', 'ben@x.be'); select t.invite('eva', 'eva@x.be'); select t.invite('gust', 'gust@x.be');
select t.as('ben'); select t.accept('ben');
select t.as('eva'); select t.accept('eva');
select t.as('owner');
select t.err($$select public.create_invitation('fien@x.be')$$, 'family full', '08 no invitation once owner + members + pending = 5');
-- the limit is checked again when someone accepts (here the limit is lowered behind the invitation's back)
reset role; update public.households set max_members = 4 where id = :'fam';
set role authenticated; select t.as('gust');
select t.err($$select t.accept('gust')$$, 'family full', '08 accepting is refused when the family is full');
reset role; update public.households set max_members = 5 where id = :'fam';
set role authenticated; select t.as('gust'); select t.accept('gust');
select t.ok((select count(*) from public.household_members where household_id = :'fam' and status = 'active') = 5, '08 five people in the family');

-- ===== 9. removing someone takes their access away at once =====
select t.as('owner');
select t.err($$select public.remove_member(auth.uid())$$, 'cannot remove themselves', '09 the owner cannot remove themselves');
select public.remove_member(t.uid('gust'));
select t.as('gust');
select t.ok(not public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 0 and (select count(*) from public.family_deals) = 0, '09 removed member loses access immediately');
select t.err($$insert into public.household_items (household_id, q) values ('$$ || :'fam' || $$', 'x')$$, 'row-level security', '09 removed member cannot add');
select t.ok(public.my_plan()->>'plan' = 'free', '09 removed member is back on free');
select t.as('ben'); select public.leave_family();
select t.ok(not public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 0, '09 a member who leaves loses access');
select t.as('owner');
select t.err($$select public.leave_family()$$, 'remove the others first', '09 the owner cannot walk away from a family with people in it');
select t.ok(public.checkout_check('single') like 'owner:%', '09 the owner must handle the members before switching to Single');

-- ===== 10. payment fails: 3 days grace, then locked; paid again: back =====
reset role; set role service_role;
select t.wh('ev_o2', 'invoice.payment_failed', 'sub_fam', 'owner', 'family', 'past_due', 30, 'failed');
set role authenticated; select t.as('ann');
select t.ok(public.has_premium(auth.uid()) and (select count(*) from public.household_items) > 0, '10 payment failed: the family keeps access during the grace days');
select t.as('owner');
select t.ok(public.my_plan()->>'payment' = 'failed' and (public.my_plan()->>'grace_until')::timestamptz > now() + interval '71 hours', '10 owner is told (payment failed, 3 days)');
reset role; update public.subscriptions set grace_until = now() - interval '1 minute' where stripe_subscription_id = 'sub_fam';
set role authenticated; select t.as('ann');
select t.ok(not public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 0, '10 after the grace days every member is locked');
select t.err($$select public.create_invitation('x@x.be')$$, 'only the owner', '10 (members still cannot invite)');
select t.as('owner');
select t.err($$select public.create_invitation('fien@x.be')$$, 'not paid', '10 an unpaid family cannot invite');
reset role; select t.ok((select count(*) from public.household_items where household_id = :'fam') = 2, '10 nothing was deleted');
set role service_role;
select t.wh('ev_o3', 'invoice.paid', 'sub_fam', 'owner', 'family', 'active', 30, 'paid');
set role authenticated; select t.as('ann');
select t.ok(public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 2, '10 paid again: everything is back');
reset role; select t.ok((select grace_until is null and last_payment_status = 'paid' from public.subscriptions where stripe_subscription_id = 'sub_fam'), '10 grace cleared');

-- ===== 11. webhooks out of order =====
set role service_role;
select t.wh('ev_o4', 'customer.subscription.updated', 'sub_fam', 'owner', 'family', 'active', 30, null, true);
select t.wh('ev_o5', 'customer.subscription.updated', 'sub_fam', 'owner', 'family', 'past_due', 30, null, false, 1000);  -- an old state arriving late
reset role;
select t.ok((select status = 'active' and cancel_at_period_end from public.subscriptions where stripe_subscription_id = 'sub_fam'), '11 an older Stripe state arriving late does not overwrite a newer one');

-- ===== 12. owner cancels: access until the period ends, then everyone locked, data kept =====
set role authenticated; select t.as('eva');
select t.ok(public.has_premium(auth.uid()), '12 cancelled at period end: still Premium until then');
select t.as('owner');
select t.ok((public.my_plan()->>'cancel_at_period_end')::boolean, '12 owner sees it will end');
reset role; set role service_role;
select t.wh('ev_o6', 'customer.subscription.deleted', 'sub_fam', 'owner', 'family', 'canceled');
set role authenticated;
select t.as('owner'); select t.ok(not public.has_premium(auth.uid()), '12 period over: owner locked');
select t.as('eva'); select t.ok(not public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 0, '12 period over: members locked');
reset role;
select t.ok((select count(*) from public.household_items where household_id = :'fam') = 2 and (select count(*) from public.household_members where household_id = :'fam' and status = 'active') = 3, '12 family data and members are kept');
-- buying Family again brings the same family back
set role service_role;
select t.ok(t.wh('ev_o7', 'checkout.session.completed', 'sub_fam2', 'owner', 'family', 'active') = 'ok', '12 owner buys Family again');
set role authenticated; select t.as('eva');
select t.ok(public.has_premium(auth.uid()) and (select count(*) from public.household_items) = 2, '12 ... and the same family with its list is back');

-- ===== 13. Single -> Family keeps the same subscription and the data =====
select t.as('solo');
reset role; set role service_role;
select t.ok(t.wh('ev_s3', 'customer.subscription.updated', 'sub_solo', 'solo', 'family', 'active') = 'ok', '13 Single switched to Family in Stripe');
reset role;
select t.ok((select count(*) from public.subscriptions where payer_id = t.uid('solo')) = 1, '13 still one subscription (no double billing)');
select t.ok((select plan_type = 'family' and family_id is not null and user_id is null from public.subscriptions where stripe_subscription_id = 'sub_solo'), '13 it now belongs to the new family');
set role authenticated; select t.as('solo');
select t.ok(public.my_plan()->'family'->>'role' = 'owner' and public.has_premium(auth.uid()), '13 the Single subscriber now owns a family');
-- and back to Single while alone
reset role; set role service_role;
select t.wh('ev_s4', 'customer.subscription.updated', 'sub_solo', 'solo', 'single', 'active');
set role authenticated; select t.as('solo');
select t.ok(public.my_plan()->>'plan' = 'single' and public.has_premium(auth.uid()) and not (public.my_plan()->'family'->>'live')::boolean, '13 Family -> Single: Single Premium, the family is locked (not deleted)');

-- ===== 14. a second paid subscription by mistake is caught =====
reset role; set role service_role;
select t.ok(t.wh('ev_s5', 'checkout.session.completed', 'sub_solo_dup', 'solo', 'single', 'active') = 'duplicate_subscription', '14 a duplicate subscription is reported so the webhook cancels it');

-- ===== 15. a member of a family cannot own another family =====
select t.ok(t.wh('ev_a1', 'checkout.session.completed', 'sub_ann', 'ann', 'family', 'active') = 'conflict_member', '15 a member buying Family is refused');
reset role;
select t.ok((select count(*) from public.households where owner = t.uid('ann')) = 0, '15 no family was made for them');

-- ===== 16. the owner's account is deleted =====
delete from auth.users where id = t.uid('other');
select t.ok((select status = 'closed' and subscription_id is null from public.households where name = 'Ons gezin' and owner is null), '16 owner deleted: the family stays, locked');

-- ===== summary =====
\o
reset role;
select n, case when ok then 'ok  ' else 'FAIL' end as r, name, coalesce(detail, '') as detail from t.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from t.results \gset
\echo :passed passed, :failed failed
select (:failed = 0) as all_passed \gset
\if :all_passed
\else
  \echo 'DATABASE TESTS FAILED'
  select 1/0;
\endif
