# Daily notification: switching it on

Every morning, right after the deals are collected, GitHub Actions runs `alerts/daily.py`. For each person who switched **Daily notification on this device** on in their account, it sends one notification to that phone or computer, but only when something on their list (or a deal they saved) is newly on promo near them. Tapping it opens their list. Claude is not involved, and no email service or domain is needed: the browser's own push service delivers it (Google for Chrome and Android, Apple for iPhone, Mozilla for Firefox).

Separately, without any setup, the site shows "3 things from your list on promo" at the top when someone opens it and something new from their list is on promo.

Until the steps below are done, the step logs "daily notification not set up: skipped" and nothing else changes.

## Steps (about 5 minutes)

1. In Supabase (project `ugfwttovexkloveuhvli`): **Project Settings → API Keys**, copy the **secret** key (`sb_secret_…`). Never put this key in the website code.
2. In GitHub: **Settings → Secrets and variables → Actions → Secrets**, add:
   - `SUPABASE_URL` = `https://ugfwttovexkloveuhvli.supabase.co`
   - `SUPABASE_SERVICE_KEY` = the Supabase secret key from step 1
   - `VAPID_PRIVATE_KEY` = the private notification key (you got it as a private file; delete that file afterwards). Its public half is already in `site/config.js`.
3. On the site, sign in, open **Account** and tick **Daily notification on this device**, and allow notifications when the browser asks. Put something on your list.

The next morning's run sends the first notifications.

**New key pair** (only if the private key is lost or leaked): run `python -m alerts.webpush --new-keys`, put the public key in `site/config.js` (`vapidPublicKey`) and the private key in the secret. Everyone then has to tick the box once more.

## iPhone and iPad

Apple only allows notifications from a website that is on the home screen (iOS 16.4 or newer). The account shows this hint on an iPhone: tap **Share → Add to Home Screen**, open deal'ke from the icon, then tick the box. Android, Windows and Mac browsers work straight away.

## Email as well (optional, later)

Email needs a domain of your own (for example `dealke.be`) verified at a sending service such as Resend (https://resend.com, free up to 3,000 emails a month). Then add the secret `RESEND_API_KEY`, the variable `ALERT_FROM` = for example `deal'ke <hallo@dealke.be>`, and set `emailAlerts: true` in `site/config.js`. An "Also by email" box then appears in the account.

## Check without sending

    python -m alerts.daily --prev data/deals.json --dry-run

(with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` set) prints who would get what.

## What people get

- At most one notification a day, only when something is new since yesterday (a new promo or a new price) for a product on their list or a deal they saved.
- Up to three products in the text ("koffie € 3,99 bij Aldi · …"), their own shop first. Tapping opens the list with the cheapest shop.
- Their language (NL, FR or EN). They switch it off with the same box in their account, or in the phone's settings; devices that switched it off are removed automatically.
