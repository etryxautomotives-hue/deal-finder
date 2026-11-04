// Stands in for supabase-js in the browser tests: the same calls the site makes, sent to tests/e2e/server.js,
// which runs them on the real local database as the signed-in test user. Sign in = localStorage "test.user".
(function () {
  const me = () => { try { return JSON.parse(localStorage.getItem("test.user") || "null"); } catch { return null; } };
  const post = (u, b) => fetch(u, { method: "POST", body: JSON.stringify({ ...b, uid: me()?.id }) }).then(r => r.json().then(j => ({ ok: r.ok, status: r.status, j })));
  function from(table) {
    const st = { table, op: "select", f: [], sel: "*" };
    const run = () => post("/__db", st).then(r => r.j);
    const q = {
      select(s) { if (st.op === "select") st.sel = s || "*"; return q; }, eq(c, v) { st.f.push(["eq", c, v]); return q; },
      gt(c, v) { st.f.push(["gt", c, v]); return q; }, is(c) { st.f.push(["is", c]); return q; }, not(c) { st.f.push(["notnull", c]); return q; },
      order(c, o) { st.order = [c, o?.ascending !== false]; return q; }, single() { st.single = true; return run(); }, maybeSingle() { st.single = true; return run(); },
      insert(v) { st.op = "insert"; st.vals = v; return q; }, update(v) { st.op = "update"; st.vals = v; return q; }, delete() { st.op = "delete"; return q; },
      upsert(v) { st.op = "upsert"; st.vals = v; return q; }, then(a, b) { return run().then(a, b); },
    };
    return q;
  }
  const listeners = [];
  window.supabase = { createClient: () => ({
    auth: {
      onAuthStateChange(cb) { listeners.push(cb); },
      getSession: async () => ({ data: { session: me() ? { user: { ...me(), user_metadata: {} } } : null } }),
      signInWithOtp: async ({ email, options }) => { window.__otp = { email, options }; return {}; },
      signOut: async () => { localStorage.removeItem("test.user"); listeners.forEach(cb => cb("SIGNED_OUT", null)); return {}; },
    },
    from, rpc: (fn, args) => post("/__db", { rpc: fn, args }).then(r => r.j),
    functions: { invoke: async (name, { body }) => {
      if (name === "customer-portal") return { data: { url: "#portal" } };
      const r = await post("/__checkout", body);
      return r.ok ? { data: r.j } : { data: null, error: { context: { json: async () => r.j } } };
    } },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {},
  }) };
})();
