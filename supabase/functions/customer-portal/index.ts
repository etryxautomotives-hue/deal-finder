// Opens Stripe's own page where the person who pays changes their card, downloads invoices or cancels.
// Family members don't pay, so they have no Stripe customer and get nothing here.
import { stripe, cors, json, userFrom, customerFor, SITE_URL } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await userFrom(req);
  if (!user) return json({ error: "not signed in" }, 401);
  const customer = await customerFor(user, false);
  if (!customer) return json({ error: "no subscription" }, 404);
  const session = await stripe.billingPortal.sessions.create({ customer, return_url: `${SITE_URL}#account` });
  return json({ url: session.url });
});
