# Turning on accounts and payments

> Premium (Single and Family) replaced the single "Plus" plan: follow [SETUP-PREMIUM.md](SETUP-PREMIUM.md) for Stripe. Section 1 (Supabase login) below still applies.

The site works without any of this: every feature is free and nothing is saved online.
Once the steps below are done, people can sign in with an email link, their list and recipes
are saved to their account, and **Plus** (unlimited own recipes, weekly plan) costs €4,99 a
month after 14 free days. Do everything in **test mode** first; nobody is charged in test mode.

What is where:

| Piece | Where it lives | What it does |
|---|---|---|
| `site/config.js` | the website | the two public Supabase keys; empty = accounts off |
| `supabase/migrations/001_accounts.sql` | Supabase database | tables `profiles` and `user_data` plus the access rules |
| `supabase/functions/create-checkout` | Supabase | sends a signed-in person to Stripe's payment page |
| `supabase/functions/customer-portal` | Supabase | Stripe's page to change card, get invoices, cancel |
| `supabase/functions/stripe-webhook` | Supabase | Stripe tells us a subscription started, renewed, failed or ended |

The browser can never unlock Plus by itself: the subscription fields are written only by the
webhook, with Stripe's signature checked.

## 1. Supabase (login and database)

1. Create a project at supabase.com. Pick region **Frankfurt (eu-central-1)** so the data stays in the EU.
2. **SQL Editor** → paste the whole of `supabase/migrations/001_accounts.sql` → Run.
3. **Authentication → URL Configuration**: Site URL = your site address
   (`https://etryxautomotives-hue.github.io/deal-finder/` until you have a domain). Add the same address under Redirect URLs.
4. **Authentication → Email templates** (optional): translate the "Magic link" email into Dutch.
   For real traffic, set up your own email sender under Authentication → SMTP (Supabase's built-in sender is limited to a few emails an hour).
5. **Project settings → API**: copy the *Project URL* and the *anon public* key into `site/config.js`.
   Never put the *service_role* key in the website.

## 2. Stripe (payments)

1. Create an account at stripe.com. Stay in **Test mode** (toggle top right).
2. **Product catalogue → Add product**: "deal'ke Plus", recurring, **€4,99 per month**, price *including* VAT if you charge VAT.
   Copy the price ID (`price_…`).
3. **Settings → Payment methods**: turn on Cards, Bancontact and SEPA Direct Debit.
4. **Settings → Billing → Customer portal**: turn on "Cancel subscriptions" and "Update payment methods", then save.
5. **Developers → API keys**: copy the *Secret key* (`sk_test_…`).

## 3. Connect them (the Supabase functions)

On a computer with the [Supabase CLI](https://supabase.com/docs/guides/cli) (or ask me to walk you through it):

```sh
supabase login
supabase link --project-ref <your project ref>
supabase secrets set STRIPE_SECRET_KEY=sk_test_… STRIPE_PRICE_ID=price_… SITE_URL=https://etryxautomotives-hue.github.io/deal-finder/
supabase functions deploy create-checkout
supabase functions deploy customer-portal
supabase functions deploy stripe-webhook --no-verify-jwt
```

Then in Stripe: **Developers → Webhooks → Add endpoint**
- URL: `https://<your project ref>.supabase.co/functions/v1/stripe-webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the signing secret (`whsec_…`) and run `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_…`

## 4. Test it

1. In `site/config.js`, set `payments: true` (sign-in already works without it; this turns on selling and locking Plus), push, and wait for the site to redeploy.
2. On the site, click the person icon → sign in with your email → click the link in the email.
3. Tarieven → *Start mijn gratis proefperiode* → Stripe's page opens → no card asked → back on the site the account says "Plus, gratis proefperiode tot …".
4. In Stripe test mode, use card `4242 4242 4242 4242` (any future date, any CVC) to try paying, and *Beheer abonnement* to try cancelling.

## 5. Going live

- Stripe asks for your **enterprise number (KBO)**, ID and **bank account** before it pays out.
- Switch Stripe to live mode, create the same product and webhook there, and set the live `sk_live_…`, live `price_…` and new `whsec_…` with `supabase secrets set`.
- VAT: under €25,000 turnover a year you can use the small-business exemption (*kleineondernemingsregeling*); otherwise charge 21% and turn on `STRIPE_AUTOMATIC_TAX=true` with Stripe Tax.
- Publish a privacy policy, terms of use and a cookie notice before taking money.
