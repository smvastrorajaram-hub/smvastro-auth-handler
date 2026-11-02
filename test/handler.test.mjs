import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../site/auth/action.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../site/auth/action.mjs", import.meta.url), "utf8");

test("verification subdomain host serves a no-index action page", () => {
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /name="referrer" content="no-referrer"/);
  assert.match(html, /src="\/auth\/action\.mjs"/);
});

test("handler keeps the Production Firebase auth domain and project identity", () => {
  assert.match(source, /authDomain: "auth\.smvastroservices\.in"/);
  assert.match(source, /projectId: "smv-astro"/);
  assert.match(source, /messagingSenderId: "299081899217"/);
});

test("handler processes verification, reset, and recovery actions", () => {
  for (const mode of ["verifyEmail", "resetPassword", "recoverEmail"]) {
    assert.ok(source.includes(`"${mode}"`));
  }
  assert.match(source, /applyActionCode\(auth, actionCode\)/);
  assert.match(source, /verifyPasswordResetCode\(auth, actionCode\)/);
  assert.match(source, /confirmPasswordReset\(auth, actionCode, newPassword\)/);
  assert.match(source, /checkActionCode\(auth, actionCode\)/);
});

test("handler removes one-time parameters and validates continuation origins", () => {
  assert.match(source, /history\.replaceState\(\{\}, document\.title, window\.location\.pathname\)/);
  assert.match(source, /ALLOWED_CONTINUE_ORIGINS\.has\(candidate\.origin\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
