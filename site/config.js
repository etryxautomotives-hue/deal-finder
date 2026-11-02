/* Accounts and payments. Leave both empty and the site runs without them (everything free).
   Fill them in from Supabase → Project settings → API. Both are public by design: the database rules
   (supabase/migrations/001_accounts.sql) decide what each visitor may read or write. */
window.DK_CONFIG = {
  supabaseUrl: "",       // e.g. "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",   // the "anon public" key
};
