// Stripe tells us when a subscription is paid, changes, fails or ends. Stripe is the only source of truth:
// the signature is checked, the subscription is fetched fresh from Stripe for every event (so events arriving
// late or twice don't matter), and the database function stripe_apply() writes it (each event id only once).
import { stripe, admin, cryptoProvider, planOfPrice } from "../_shared/stripe.ts";

const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const HANDLED = new Set(["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated",
  "customer.subscription.deleted", "invoice.paid", "invoice.payment_failed"]);

// deno-lint-ignore no-explicit-any
function subscriptionIdOf(type: string, o: any): string | null {
  if (type === "checkout.session.completed") return o.mode === "subscription" ? o.subscription : null;
  if (type.startsWith("customer.subscription.")) return o.id;
  return o.subscription ?? o.parent?.subscription_details?.subscription ?? null;   // invoices (old and new API shape)
}

Deno.serve(async (req) => {
  const sig = req.headers.get("Stripe-Signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), sig, secret, undefined, cryptoProvider);
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }
  if (!HANDLED.has(event.type)) return new Response("ignored");
  const subId = subscriptionIdOf(event.type, event.data.object);
  if (!subId) return new Response("no subscription");

  const s = await stripe.subscriptions.retrieve(subId);
  const item = s.items.data[0];
  // deno-lint-ignore no-explicit-any
  const any = s as any;
  const p = {
    event_id: event.id,
    type: event.type,
    created: event.created,
    state_at: Math.floor(Date.now() / 1000),
    customer: typeof s.customer === "string" ? s.customer : s.customer.id,
    subscription: s.id,
    payer: s.metadata?.user_id ?? null,
    plan: planOfPrice(item?.price?.id) ?? s.metadata?.plan ?? null,
    status: s.status,
    period_start: any.current_period_start ?? any.items?.data?.[0]?.current_period_start ?? null,
    period_end: any.current_period_end ?? any.items?.data?.[0]?.current_period_end ?? null,
    cancel_at_period_end: s.cancel_at_period_end,
    invoice: event.type === "invoice.paid" ? "paid" : event.type === "invoice.payment_failed" ? "failed" : null,
  };
  const { data: result, error } = await admin.rpc("stripe_apply", { p });
  if (error) return new Response(error.message, { status: 500 });   // Stripe tries again later

  // A second subscription by mistake, or a family member who bought their own Family: stop it in Stripe at once.
  if ((result === "duplicate_subscription" || result === "conflict_member") && s.status !== "canceled") {
    await stripe.subscriptions.cancel(s.id, { prorate: true, invoice_now: false });
    console.warn(`cancelled ${s.id}: ${result} (check for a refund in the Stripe dashboard)`);
  }
  return new Response(String(result ?? "ok"));
});
