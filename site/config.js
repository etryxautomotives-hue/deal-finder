/* Accounts and payments. Leave the keys empty and the site runs without accounts (everything free).
   Both keys are public by design: the database rules (supabase/migrations/001_accounts.sql)
   decide what each visitor may read or write. Never put the secret / service_role key here. */
window.DK_CONFIG = {
  supabaseUrl: "https://ugfwttovexkloveuhvli.supabase.co",
  supabaseAnonKey: "sb_publishable_qVKVrdXSNBv0DAPWgfRAEg_D6eRPgc_",
  payments: false,   // true once Stripe is set up (docs/SETUP-PREMIUM.md): then Single and Family are sold
  // Daily notification on the phone or computer (web push). The public half of the key pair; the private half is only
  // in the GitHub secret VAPID_PRIVATE_KEY (docs/SETUP-ALERTS.md). Empty: the option is hidden.
  vapidPublicKey: "BGsu8adv_FSZ7TeETpoHaju7iOEIi7MFOUbMUBJGrD04-IeqgIYKoPC8JsmomtN7TJtSTInqNsiqe7aUfwCibCY",
  emailAlerts: false, // true once Resend and a domain of our own are set up: then "also by email" shows in the account
};
