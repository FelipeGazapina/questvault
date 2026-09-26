import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  allowedChoices,
  applyXp,
  coinsToCents,
  dueAtFor,
  inWindow,
  isoWeekKey,
  localParts,
  localTimeToMs,
  nextStreak,
  penalizeTime,
  periodKeyFor,
  quietDelayMs,
  rankFor,
  settleTimeDebt,
  shouldSpawn,
  spendTime,
  timeBalance,
  xpToNext,
} from "./rules.ts";

const BRT = -180;

test("applyXp rolls over levels", () => {
  assert.deepEqual(applyXp(1, 90, 5), { level: 1, xp: 95, leveledUp: false });
  const r = applyXp(1, 90, 20);
  assert.equal(r.level, 2);
  assert.equal(r.xp, 110 - xpToNext(1));
  assert.equal(r.leveledUp, true);
});

test("rankFor thresholds", () => {
  assert.equal(rankFor(4), "apprentice");
  assert.equal(rankFor(7), "squire");
  assert.equal(rankFor(12), "knight");
  assert.equal(rankFor(20), "legend");
});

test("localParts uses the family offset", () => {
  // 2026-09-26 01:30 UTC is still 25th 22:30 in Brasília (Friday).
  const ms = Date.UTC(2026, 8, 26, 1, 30);
  assert.deepEqual(localParts(ms, BRT), { date: "2026-09-25", minutes: 22 * 60 + 30, weekday: 5 });
});

test("localTimeToMs round-trips", () => {
  const ms = localTimeToMs("2026-09-25", "20:00", BRT);
  assert.equal(new Date(ms).toISOString(), "2026-09-25T23:00:00.000Z");
});

test("periods and weekly due date", () => {
  assert.equal(periodKeyFor("daily", "2026-09-25"), "2026-09-25");
  assert.equal(periodKeyFor("weekly", "2026-09-25"), isoWeekKey("2026-09-25"));
  assert.equal(periodKeyFor("once", "2026-09-25"), "once");
  // Friday → due Sunday 20:00 local.
  const due = dueAtFor("weekly", "2026-09-25", 5, "20:00", BRT);
  assert.equal(due, localTimeToMs(addDays("2026-09-25", 2), "20:00", BRT));
});

test("daily missions wait for their appear time", () => {
  assert.equal(shouldSpawn("daily", 16 * 60, "17:00"), false);
  assert.equal(shouldSpawn("daily", 17 * 60, "17:00"), true);
  assert.equal(shouldSpawn("weekly", 0, "17:00"), true);
});

test("quiet windows wrap midnight", () => {
  assert.equal(inWindow(22 * 60, "21:30", "07:00"), true);
  assert.equal(inWindow(6 * 60, "21:30", "07:00"), true);
  assert.equal(inWindow(12 * 60, "21:30", "07:00"), false);
  // 23:00 local → wait until 07:00 = 8 h.
  const ms = localTimeToMs("2026-09-25", "23:00", BRT);
  assert.equal(quietDelayMs(ms, BRT, "21:30", "07:00"), 8 * 3_600_000);
  assert.equal(quietDelayMs(localTimeToMs("2026-09-25", "12:00", BRT), BRT, "21:30", "07:00"), 0);
});

test("time bank spends the soonest-expiring grants first and ignores expired ones", () => {
  const now = 1000;
  const grants = [
    { remaining: 30, expiresAt: 5000 },
    { remaining: 20, expiresAt: 2000 },
    { remaining: 50, expiresAt: 500 },
  ];
  assert.equal(timeBalance(grants, now), 50);
  assert.deepEqual(spendTime(grants, 25, now), [25, 0, 50]);
  assert.equal(spendTime(grants, 60, now), null);
});

test("allowance, choices and streaks", () => {
  assert.equal(coinsToCents(250, 500), 1000);
  assert.deepEqual(allowedChoices("choice"), ["coins", "time"]);
  assert.deepEqual(allowedChoices("item"), ["item"]);
  assert.equal(nextStreak(4, "2026-09-24", "2026-09-25"), 5);
  assert.equal(nextStreak(4, "2026-09-25", "2026-09-25"), 4);
  assert.equal(nextStreak(4, "2026-09-20", "2026-09-25"), 1);
});

test("penalizeTime drains oldest-expiring grants, then leaves debt", () => {
  const now = 1_000;
  const grants = [
    { remaining: 20, expiresAt: 9_000 },
    { remaining: 15, expiresAt: 5_000 },
    { remaining: 50, expiresAt: 500 }, // expired: untouched
  ];
  assert.deepEqual(penalizeTime(grants, 10, now), { remaining: [20, 5, 50], debt: 0 });
  assert.deepEqual(penalizeTime(grants, 30, now), { remaining: [5, 0, 50], debt: 0 });
  assert.deepEqual(penalizeTime(grants, 60, now), { remaining: [0, 0, 50], debt: 25 });
  assert.deepEqual(penalizeTime([], 30, now), { remaining: [], debt: 30 });
});

test("settleTimeDebt pays oldest debt first and returns what's left", () => {
  assert.deepEqual(settleTimeDebt([], 30), { debts: [], left: 30 });
  assert.deepEqual(settleTimeDebt([10, 20], 15), { debts: [0, 15], left: 0 });
  assert.deepEqual(settleTimeDebt([10, 20], 45), { debts: [0, 0], left: 15 });
});

test("a penalty bigger than the bank makes the balance negative until new time arrives", () => {
  const now = 1_000;
  const bank = [{ remaining: 10, expiresAt: 9_000 }];
  const { remaining, debt } = penalizeTime(bank, 30, now);
  const after = [{ remaining: remaining[0], expiresAt: 9_000 }, { remaining: -debt, expiresAt: Number.MAX_SAFE_INTEGER }];
  assert.equal(timeBalance(after, now), -20);
  assert.equal(spendTime(after, 1, now), null);
  const { debts, left } = settleTimeDebt([debt], 30);
  assert.deepEqual(debts, [0]);
  assert.equal(left, 10);
});
