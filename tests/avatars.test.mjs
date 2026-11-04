// Run with: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const A = createRequire(import.meta.url)("../site/avatars.js");

test("twelve built-in pictures, each drawn", () => {
  assert.equal(A.KEYS.length, 12);
  for (const k of A.KEYS) assert.match(A.svg(k), /^<svg viewBox="0 0 64 64"/);
});

test("only our own pictures and small photos are shown, nothing that can load or run code", () => {
  assert.ok(A.ok("a:fox"));
  assert.ok(A.ok("data:image/jpeg;base64,/9j/4AAQ"));
  assert.ok(!A.ok("https://evil.example/x.png"));
  assert.ok(!A.ok("data:image/svg+xml;base64,PHN2Zz4="));
  assert.ok(!A.ok('data:image/jpeg;base64,AA" onerror="alert(1)'));
  assert.match(A.html("javascript:alert(1)", 40), /<span class="av"/);   // falls back to a built-in face
  assert.doesNotMatch(A.html("a:fox", 40, '"><script>'), /<script>/);
});
