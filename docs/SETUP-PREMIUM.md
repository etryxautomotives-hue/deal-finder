# Turning on Single & Family Premium

deal'ke has three plans:

| Plan | Price | Who |
|---|---|---|
| Gratis | €0 | everyone: all deals, My list, 1 own recipe |
| **Single** | **€4,99 a month** | one account, not shareable: unlimited recipes, week plan, synced on every device |
| **Family** | **€12,99 a month** | up to 5 accounts (owner + 4), only the owner pays: everything in Single for everyone, plus one shared shopping list, shared deals and "saved together" |

Family costs €11,96 a month less than five Singles (€24,95). That is **48 %** cheaper, or €2,60 per person.
(The 70 % in the original brief doesn't match these prices, so the site shows the euro amount instead.)
Billing is monthly only. Prices are shown the Dutch way (€ 4,99).

Nothing is sold until `payments: true` in `site/config.js`. Do everything in Stripe **test mode** first.

## What is where

| Piece | Where | What it does |
|---|---|---|
| `supabase/migrations/003_households.sql` | database | the family tables (run first) |
| `supabase/migrations/004_premium_families.sql` | database | subscriptions, roles, invitations, activity, every access rule, and `stripe_apply()` for the webhook |
| `supabase/functions/create-checkout` | Supabase | buy Single or Family, or switch between them on the same subscription |
| `supabase/functions/customer-portal` | Supabase | Stripe's own page: card, invoices, cancel (only for the person who pays) |
| `supabase/functions/stripe-webhook` | Supabase | Stripe → database, signature checked, each event applied once |
| `site/app.js` | website | pricing page, subscription page, family page, shared list (it only *shows*; the database decides) |

## Security, in short

- Premium, roles and families are **never** set from the browser. The browser has no write access to `subscriptions`,
  `stripe_events`, `family_invitations` or `family_activity`. It cannot insert into `households` or `household_members`,
  and it can only change its own name and picture. Everything else goes through database functions that check who is asking.
- A family's list, shared deals and activity are readable only by **active** members of a **paid** family.
  Removing someone takes their access away on their next request. Nothing is deleted when a payment stops.
- Premium starts only when Stripe tells the webhook the subscription is active. Coming back to the site from Checkout is not enough.
- Invitations are bound to one email address, valid 48 hours and usable once. The database keeps only a SHA-256 hash of the token.
  When someone accepts, the family row is locked, so two people accepting at once can never make a sixth member.
- The Stripe secret key, the webhook secret and the service key live only in Supabase secrets, never in the website.

## 1. Database (Supabase → SQL Editor)

Run these in order, each as one paste:
1. `supabase/migrations/003_households.sql`, if not run yet.
2. `supabase/migrations/004_premium_families.sql`.

You can run them again safely.

## 2. Stripe

1. stripe.com, **Test mode** on.
2. **Product catalogue → Add product**:
   - "deal'ke Single", recurring monthly, **€4,99** EUR. Copy its price ID (`price_…`).
   - "deal'ke Family", recurring monthly, **€12,99** EUR. Copy its price ID.
3. **Settings → Payment methods**: Cards, Bancontact, SEPA Direct Debit.
4. **Settings → Billing → Customer portal**: allow "Cancel subscriptions" (at the end of the billing period) and "Update payment methods". Do **not** allow switching plans there: switching is done on the site, so the family rules are checked first.
5. **Settings → Billing → Subscriptions and emails**:
   - Turn on "Send emails about failed payments". This is how the owner is told by email; the site also shows a warning.
   - Set retries to at least 3 days, so Stripe keeps trying during the grace period.
6. **Developers → API keys**: copy the secret key (`sk_test_…`).

## 3. Supabase functions and secrets (Supabase CLI)

```sh
supabase login
supabase link --project-ref ugfwttovexkloveuhvli
supabase secrets set STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_SINGLE=price_… STRIPE_PRICE_FAMILY=price_… SITE_URL=https://etryxautomotives-hue.github.io/deal-finder/
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

In Stripe, go to **Developers → Webhooks → Add endpoint**:
- URL: `https://ugfwttovexkloveuhvli.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
- Copy the signing secret, then run `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_…`

(`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are already there in every Supabase function.)

## 4. Test it (test mode, card 4242 4242 4242 4242)

1. Set `payments: true` in `site/config.js` and push.
2. Account A: Tarieven → Neem Family → pay → back on the site "Even geduld…", then "Family · € 12,99".
3. Account A: Mijn account → invite B's email → Mail de link.
4. Account B: open the link → sign in with B's email → Doe mee. B sees "Family, betaald door A" and no payment buttons.
5. Both on My list: add for the family, tick, change quantities. The other phone updates by itself.
6. A removes B: B's family list disappears. B's own list stays.
7. Payment failure: use card `4000 0000 0000 0341`, then advance the subscription with a Stripe test clock. The owner sees the warning; after 3 days everyone is paused.
8. Cancel in the portal: it keeps working until the period ends, then pauses. Buying Family again brings the same family and list back.

## 5. Going live

Same as before: Stripe needs your KBO number and bank account. Then create the two live prices and the live webhook,
and set `sk_live_…`, the live price IDs and the new `whsec_…` with `supabase secrets set`.
On VAT: if your turnover stays under €25.000, the small-business exemption applies. Otherwise charge 21 % and set `STRIPE_AUTOMATIC_TAX=true`.
Have a privacy policy and terms in place before you take money.

## Tests

- `PGHOST=… PGPORT=… tests/db/run.sh` runs every migration on a local Postgres and then 112 checks as many fake accounts:
  free, Single and Family, invites, the 6th person, removal, grace, cancel, duplicate and late webhooks, tampering, cross-family access,
  and two people accepting at once.
- `tests/e2e/family.e2e.js` runs 36 checks on a phone in the browser against that same real database.
  It covers buying, inviting, accepting, the shared list, removal, Single → Family and a failed payment.
  Stripe itself is simulated there by calling the webhook's database function.
