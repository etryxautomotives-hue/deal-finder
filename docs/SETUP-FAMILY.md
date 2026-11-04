# Sharing a list with family and friends: switching it on

People can share one shopping list. In **Account** they see "Mijn huis" (a house with everyone's picture), tap **Nodig iemand uit** and send the link. Whoever opens the link and signs in joins the home. From then on, "Wat je nodig hebt" on My list is the same list for everyone: anyone can add, tick off (it shows who) and remove items, and ticks appear on the other phones straight away.

Until the step below is done, the house is hidden and everything else works as before.

## One step (2 minutes)

1. Open Supabase (project `ugfwttovexkloveuhvli`) → **SQL Editor** → **New query**.
2. Paste the whole file [`supabase/migrations/003_households.sql`](../supabase/migrations/003_households.sql) and click **Run**. It should say "Success. No rows returned".
3. Check **Database → Publications → supabase_realtime**: `household_items` should be listed (the script adds it). That makes ticks appear live.

## How it is kept private

- Only members can see a home, its members and its list (row-level security, tested with a stranger account).
- People join only with an invite link; links expire after 14 days.
- Members can only change their own name and picture. The person who made the home can remove others; everyone can leave.
- One home per person. Joining another home leaves the old one.

## Profile pictures

Twelve pictures are drawn in `site/avatars.js` (no files, nothing from elsewhere). A photo from the device is cut to a 160 × 160 square in the browser and saved as a small JPEG (about 10 kB) with the account; it is never sent anywhere else.
