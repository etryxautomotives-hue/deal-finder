// Shared helpers for the three payment functions. Secrets are set with `supabase secrets set` (see docs/SETUP-PAYMENTS.md).
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient() });
export const cryptoProvider = Stripe.createSubtleCryptoProvider();
export const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://etryxautomotives-hue.github.io/deal-finder/";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// The signed-in user from the request's Authorization header, or null.
export async function userFrom(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await admin.auth.getUser(token);
  return data.user ?? null;
}

// The user's Stripe customer, created on first use and remembered on their profile.
export async function customerFor(user: { id: string; email?: string }) {
  const { data: p } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  if (p?.stripe_customer_id) return p.stripe_customer_id as string;
  const c = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
  await admin.from("profiles").upsert({ id: user.id, email: user.email, stripe_customer_id: c.id });
  return c.id;
}
