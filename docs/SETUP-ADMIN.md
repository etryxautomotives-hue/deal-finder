# Admin back end: setup (about 5 minutes, once)

The back end lives at **`admin.html`** on the site, e.g. `https://etryxautomotives-hue.github.io/deal-finder/admin.html`.
Anyone can open that address, but the database only answers people you gave access, so strangers see "No access".

## 1. Run the database change

Supabase → your project → **SQL editor** → New query → paste all of `supabase/migrations/005_admin.sql` → **Run**.
(004 must have run before. Running 005 twice is safe.)

## 2. Make yourself the owner

In the same SQL editor, with **your own** email (the one you sign in to deal'ke with):

```sql
insert into public.admins (user_id, email, role)
select id, email, 'owner' from auth.users where email = 'YOUR@EMAIL';
```

It should say "1 row". If it says 0, sign in on the site once with that email first, then run it again.

## 3. Let the sign-in link come back to the admin page

Supabase → **Authentication → URL Configuration → Redirect URLs** → add
`https://etryxautomotives-hue.github.io/deal-finder/**` (or your own domain with `/**` at the end) → Save.

## 4. Open it

Go to `…/admin.html`, type your email, click the link in your inbox. Done.

## Coworkers

**Team → Make a link** and send it. Whoever opens it and signs in gets in. The link keeps working until you press
**Switch off**, so switch it off once your coworkers are in. Everyone who joined is listed under "People with access"
and can be removed or given another role:

| Role | Can |
|---|---|
| Owner | everything, including the team |
| Everything except managing the team (admin) | reports, PDFs, users, email list, site control, activity log |
| Reports only (viewer) | anonymous reports and PDFs, no emails |

Every look at the user or email list, every download and every change is written to the **Activity log** with the person's email.

## What is collected, and the rules (GDPR)

* **Cookie banner** (`site/consent.js`): statistics are only sent after "Akkoord". "Weigeren" is just as big. The choice is asked again after 6 months, and can be changed with "Cookies" in the footer.
* **Statistics** hold no name, email, account or IP: a random id per visit, what was looked at, added or searched, phone/computer, language and the first two postcode digits.
* **Raw clicks are deleted after 13 months.** Daily totals (no visit ids) are kept for good, so growth per month stays visible.
* **Email list**: only people who ticked "Stuur me deal'ke-nieuws" (at sign-up or in their account). The full user list is for running the service, not for newsletters. Every newsletter needs an unsubscribe link.
* **Privacy page** (`site/privacy.html`): fill in the yellow placeholders (who runs deal'ke, address, company number, contact email) before launch.

## Site control

Message bar (NL/FR/EN, green or yellow), switch the Recipes or Pricing page off, a "back soon" screen, hide a shop, hide one deal
(e.g. a wrong price). Visitors see a change on their next page load.

## Tests

```
PGHOST=/tmp/pgdk PGPORT=5433 tests/db/run.sh                 # database rules, incl. tests/db/admin.test.sql
PGHOST=/tmp/pgdk PGPORT=5433 DATA_ROOT=. node tests/e2e/server.js 8765 &
PDF_LIBS=<node_modules with jspdf@2.5.1 + jspdf-autotable@3.8.2> node tests/e2e/admin.e2e.js
```
