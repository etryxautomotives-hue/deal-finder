// Starts the Plus subscription: 14 days free, then €4,99 a month (the price set in STRIPE_PRICE_ID).
// No card is asked during the trial; if none is added by day 14 the subscription simply ends.
import { stripe, cors, json, userFrom, customerFor, admin, SITE_URL } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await userFrom(req);
  if (!user) return json({ error: "not signed in" }, 401);

  const { data: p } = await admin.from("profiles").select("subscription_status, trial_end").eq("id", user.id).single();
  if (p?.subscription_status === "active" || p?.subscription_status === "trialing") return json({ error: "already subscribed" }, 409);
  const hadTrial = !!p?.trial_end; // one free trial per person

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: await customerFor(user),
    line_items: [{ price: Deno.env.get("STRIPE_PRICE_ID")!, quantity: 1 }],
    payment_method_collection: hadTrial ? "always" : "if_required",
    subscription_data: hadTrial ? {} : {
      trial_period_days: 14,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
    },
    automatic_tax: { enabled: Deno.env.get("STRIPE_AUTOMATIC_TAX") === "true" },
    customer_update: Deno.env.get("STRIPE_AUTOMATIC_TAX") === "true" ? { address: "auto" } : undefined,
    allow_promotion_codes: true,
    success_url: `${SITE_URL}?paid=1#account`,
    cancel_url: `${SITE_URL}#pricing`,
  });
  return json({ url: session.url });
});
