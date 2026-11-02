// Stripe tells us when a subscription starts, renews, fails or ends; we copy that onto the profile.
// The site only trusts these fields, so nobody can unlock Plus from the browser.
import { stripe, admin, cryptoProvider } from "../_shared/stripe.ts";

const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const ts = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

Deno.serve(async (req) => {
  const sig = req.headers.get("Stripe-Signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret, undefined, cryptoProvider);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }
  if (event.type.startsWith("customer.subscription.")) {
    // deno-lint-ignore no-explicit-any
    const s = event.data.object as any;
    // newer Stripe API versions keep the period end on the subscription item
    const periodEnd = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
    const { error } = await admin.from("profiles").update({
      subscription_status: event.type === "customer.subscription.deleted" ? "canceled" : s.status,
      trial_end: ts(s.trial_end),
      current_period_end: ts(periodEnd),
      cancel_at_period_end: s.cancel_at_period_end,
    }).eq("stripe_customer_id", s.customer);
    if (error) return new Response(error.message, { status: 500 }); // Stripe retries
  }
  return new Response("ok");
});
