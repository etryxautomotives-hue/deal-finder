# Daily email: switching it on

Every morning, right after the deals are collected, GitHub Actions runs `alerts/daily.py`. It sends one short email to each person who switched "Daily email" on in their account, but only when something on their list (or a deal they saved) is newly on promo near them. Claude is not involved.

Until the steps below are done, the step just logs "daily email not set up: skipped" and nothing else changes.

## What you need

1. **A domain of your own** (for example `dealke.be`). Email services only send to everyone once you prove you own the sending domain; without one, you can only send test emails to yourself. This is the same domain question as the site address.
2. **A free Resend account**: https://resend.com (free up to 3,000 emails a month, 100 a day).

## Steps

1. In Resend: **Domains → Add domain**, type your domain, and add the DNS records it shows at your domain provider. Wait until it says *Verified*.
2. In Resend: **API Keys → Create API key** (permission: *Sending access*). Copy it.
3. In Supabase (project `ugfwttovexkloveuhvli`): **Project Settings → API Keys**, copy the **secret** key (`sb_secret_…`). Never put this key in the website code.
4. In GitHub: **Settings → Secrets and variables → Actions**.
   - Under **Secrets**, add:
     - `SUPABASE_URL` = `https://ugfwttovexkloveuhvli.supabase.co`
     - `SUPABASE_SERVICE_KEY` = the Supabase secret key from step 3
     - `RESEND_API_KEY` = the Resend key from step 2
   - Under **Variables**, add `ALERT_FROM` = for example `deal'ke <hallo@dealke.be>` (it must use the verified domain).
5. On the site, sign in, open **Account**, tick **Daily email**, and put something on your list.

The next morning's run sends the first emails. To check before then, run this locally with the same values set as environment variables:

    python -m alerts.daily --prev data/deals.json --dry-run

## What people get

- At most one email a day, only when something is new since yesterday (a new promo or a new price) for a product on their list or a deal they saved.
- Their own shop first, with "cheaper at …" when another shop nearby is cheaper.
- Their language (NL, FR or EN), and a link to switch it off in their account.
