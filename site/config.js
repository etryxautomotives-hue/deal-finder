/* Accounts and payments. Leave the keys empty and the site runs without accounts (everything free).
   Both keys are public by design: the database rules (supabase/migrations/001_accounts.sql)
   decide what each visitor may read or write. Never put the secret / service_role key here. */
window.DK_CONFIG = {
  supabaseUrl: "https://ugfwttovexkloveuhvli.supabase.co",
  supabaseAnonKey: "sb_publishable_qVKVrdXSNBv0DAPWgfRAEg_D6eRPgc_",
  payments: false,   // set to true once Stripe is connected (docs/SETUP-PAYMENTS.md); until then Plus is not sold or locked
};
