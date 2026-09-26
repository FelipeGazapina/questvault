import assert from "node:assert/strict";
import test from "node:test";

import { formatResetCode, normalizeResetCode, renderResetEmail } from "./resetEmail.ts";

test("formatResetCode groups 8 digits as 4 + 4", () => {
  assert.equal(formatResetCode("12345678"), "1234 5678");
  assert.equal(formatResetCode("123"), "123");
});

test("normalizeResetCode keeps only digits", () => {
  assert.equal(normalizeResetCode(" 1234-5678 "), "12345678");
  assert.equal(normalizeResetCode("1234 5678"), "12345678");
});

test("renderResetEmail carries the code and expiry in both languages", () => {
  const { subject, text, html } = renderResetEmail("12345678", 15);
  assert.doesNotMatch(subject, /1234|5678/);
  assert.match(text, /redefinir a senha do QuestVault é: 1234 5678/);
  assert.match(text, /expires in 15 minutes/);
  assert.match(html, /1234 5678/);
  assert.match(html, /15 minutos/);
});
