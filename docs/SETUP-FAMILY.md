# Family (shared list)

Sharing a list is now part of **Family Premium** (€12,99 a month, up to 5 people, only the owner pays).
Setup, security and tests are in [SETUP-PREMIUM.md](SETUP-PREMIUM.md).

Run `supabase/migrations/003_households.sql` and then `004_premium_families.sql`.
003 on its own is not enough: since 004, a family exists only after a paid Family subscription,
and people join only with an email invitation.
