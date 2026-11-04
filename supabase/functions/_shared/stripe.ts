// Shared helpers for the payment functions. Secrets are set with `supabase secrets set` (docs/SETUP-PREMIUM.md);
// none of them ever reach the website.
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
export const cryptoProvider = Stripe.createSubtleCryptoProvider();
export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://etryxautomotives-hue.github.io/deal-finder/";

// The two monthly prices (EUR) made in Stripe: Single €4,99 and Family €12,99.
export const PRICES = {
  single: Deno.env.get("STRIPE_PRICE_SINGLE") ?? Deno.env.get("STRIPE_PRICE_ID") ?? "",
  family: Deno.env.get("STRIPE_PRICE_FAMILY") ?? "",
};
export const planOfPrice = (id?: string | null) =>
  id && id === PRICES.family ? "family" : id && id === PRICES.single ? "single" : null;

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const tokenOf = (req: Request) => (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");

// The signed-in user from the request's Authorization header, or null.
export async function userFrom(req: Request) {
  const token = tokenOf(req);
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

// The database as that user (their own token, so the rules see who they are): used for checkout_check().
export const asUser = (req: Request) =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${tokenOf(req)}` } },
    auth: { persistSession: false },
  });

// The user's Stripe customer, created on first use and remembered on their profile.
export async function customerFor(user: { id: string; email?: string }, create = true) {
  const { data: p } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (p?.stripe_customer_id) return p.stripe_customer_id as string;
  if (!create) return null;
  const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
  await admin.from("profiles").upsert({ id: user.id, email: user.email, stripe_customer_id: c.id });
  return c.id;
}
