import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePushLocale,
  pushNotificationContent,
  shouldSendPeriodPush,
} from "./pushMessages.ts";

test("shouldSendPeriodPush — sends when spawned and not yet sent", () => {
  assert.equal(shouldSendPeriodPush({ spawnedCount: 2, alreadySent: false }), true);
});

test("shouldSendPeriodPush — skips empty spawn", () => {
  assert.equal(shouldSendPeriodPush({ spawnedCount: 0, alreadySent: false }), false);
});

test("shouldSendPeriodPush — skips duplicate period", () => {
  assert.equal(shouldSendPeriodPush({ spawnedCount: 3, alreadySent: true }), false);
});

test("pushNotificationContent — daily en/pt", () => {
  assert.match(pushNotificationContent("daily", "en").title, /daily/i);
  assert.match(pushNotificationContent("daily", "pt").title, /diárias/i);
});

test("pushNotificationContent — side and boss", () => {
  assert.match(pushNotificationContent("side", "en").body, /week/i);
  assert.match(pushNotificationContent("boss", "pt").body, /mensal/i);
});

test("normalizePushLocale", () => {
  assert.equal(normalizePushLocale("en-US"), "en");
  assert.equal(normalizePushLocale("pt-BR"), "pt");
  assert.equal(normalizePushLocale(undefined), "pt");
});
