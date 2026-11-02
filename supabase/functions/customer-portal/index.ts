// Opens Stripe's own page where people change their card, download invoices or cancel.
import { stripe, cors, json, userFrom, customerFor, SITE_URL } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await userFrom(req);
  if (!user) return json({ error: "not signed in" }, 401);
  const session = await stripe.billingPortal.sessions.create({ customer: await customerFor(user), return_url: `${SITE_URL}#account` });
  return json({ url: session.url });
});
