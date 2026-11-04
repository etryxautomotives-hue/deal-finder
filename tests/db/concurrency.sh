#!/usr/bin/env bash
# Two people accept an invitation at the very same moment while only one place is left:
# exactly one may get in (accept_invitation locks the family row). Runs after premium.test.sql.
set -uo pipefail
P="psql -X -q -t -A -U ${PGUSER:-postgres} -d ${PGDATABASE:-postgres}"
$P -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
update public.households h set max_members = (select count(*) from public.household_members m where m.household_id = h.id and m.status = 'active') + 1
  where owner = t.uid('owner');
insert into public.family_invitations (family_id, invited_email, invited_by, token_hash)
  select id, e, owner, encode(sha256(convert_to('race-' || e, 'UTF8')), 'hex') from public.households, (values ('fien@x.be'), ('hans@x.be')) v(e)
  where owner = t.uid('owner');
SQL
race() { $P 2>&1 <<SQL
set role authenticated; select t.as('$1');
begin;
select public.accept_invitation('race-$1@x.be');
select pg_sleep(1);
commit;
SQL
}
race fien > /tmp/race_fien.txt & race hans > /tmp/race_hans.txt & wait
in=$($P -c "select count(*) from public.household_members m join public.households h on h.id = m.household_id where h.owner = t.uid('owner') and m.status = 'active' and m.user_id in (t.uid('fien'), t.uid('hans'))")
full=$($P -c "select count(*) = max(max_members) from public.household_members m join public.households h on h.id = m.household_id where h.owner = t.uid('owner') and m.status = 'active'")
cat /tmp/race_fien.txt /tmp/race_hans.txt | grep -i "family full" >/dev/null && refused=1 || refused=0
if [ "$in" = "1" ] && [ "$full" = "t" ] && [ "$refused" = "1" ]; then echo "ok   17 two people accepting at once for the last place: one gets in, the other is told the family is full"; exit 0; fi
echo "FAIL 17 concurrent accept: $in got in, full=$full"; cat /tmp/race_fien.txt /tmp/race_hans.txt; exit 1
