// Starts or changes a Premium subscription. Body: { plan: "single" | "family" }.
// What is allowed is decided by the database (checkout_check), never by the browser:
//   new        -> Stripe Checkout for that plan (Premium starts only when Stripe tells the webhook it is paid)
//   switch:sub -> Single <-> Family on the SAME subscription, so nobody pays twice; an upgrade only takes effect
//                 once the price difference is paid (payment_behavior "pending_if_incomplete")
//   otherwise  -> refused with the reason (already subscribed, member must leave first, owner must remove members first)
import { stripe, cors, json, userFrom, customerFor, asUser, PRICES, SITE_URL } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await userFrom(req);
  if (!user) return json({ error: "not signed in" }, 401);
  const body = await req.json().catch(() => ({}));
  if (body?.plan !== "single" && body?.plan !== "family") return json({ error: "bad plan" }, 400);
  const plan: "single" | "family" = body.plan;
  if (!PRICES[plan]) return json({ error: "price not configured" }, 500);

  const { data: check, error } = await asUser(req).rpc("checkout_check", { want: plan });
  if (error) return json({ error: "check failed" }, 500);

  if (typeof check === "string" && check.startsWith("switch:")) {
    const sub = await stripe.subscriptions.retrieve(check.slice(7));
    const upgrade = plan === "family";
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: sub.items.data[0].id, price: PRICES[plan] }],
      proration_behavior: upgrade ? "always_invoice" : "create_prorations",   // pay the difference now / credit on the next bill
      payment_behavior: upgrade ? "pending_if_incomplete" : "allow_incomplete",
      cancel_at_period_end: false,
      metadata: { user_id: user.id, plan },
    });
    return json({ switched: plan });
  }
  if (check !== "new") return json({ error: check }, 409);

  const customer = (await customerFor(user))!;
  // two tabs must not make two subscriptions: close any checkout that is still open
  const open = await stripe.checkout.sessions.list({ customer, status: "open", limit: 10 });
  for (const s of open.data) await stripe.checkout.sessions.expire(s.id).catch(() => {});

  const tax = Deno.env.get("STRIPE_AUTOMATIC_TAX") === "true";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: PRICES[plan], quantity: 1 }],
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    automatic_tax: { enabled: tax },
    customer_update: tax ? { address: "auto" } : undefined,
    allow_promotion_codes: true,
    locale: "auto",
    success_url: `${SITE_URL}?paid=1#account`,
    cancel_url: `${SITE_URL}#pricing`,
  });
  return json({ url: session.url });
});
