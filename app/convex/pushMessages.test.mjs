import assert from "node:assert/strict";
import test from "node:test";

import { normalizePushLocale, penaltyLabel, renderNotice, rewardLabel } from "./pushMessages.ts";

test("normalizePushLocale", () => {
  assert.equal(normalizePushLocale("en-US"), "en");
  assert.equal(normalizePushLocale("pt-BR"), "pt");
  assert.equal(normalizePushLocale(undefined), "pt");
});

test("rewardLabel — coins, time, item and choice", () => {
  assert.equal(rewardLabel({ rewardKind: "coins", rewardAmount: 50 }, "pt"), "50 moedas");
  assert.equal(rewardLabel({ rewardKind: "time", rewardAmount: 30 }, "pt"), "30 min de tela");
  assert.equal(rewardLabel({ rewardKind: "item", itemTitle: "Sorvete" }, "en"), "Sorvete");
  assert.equal(rewardLabel({ rewardKind: "choice", coins: 50, minutes: 30 }, "pt"), "50 moedas ou 30 min");
});

test("renderNotice — new mission for the adventurer", () => {
  const n = renderNotice("mission_new", { title: "Arrumar o quarto", due: "20:00", rewardKind: "choice", coins: 50, minutes: 30 }, "pt");
  assert.equal(n.title, "Nova missão: Arrumar o quarto");
  assert.equal(n.body, "Até 20:00 · 50 moedas ou 30 min");
});

test("renderNotice — submission tells the guardian what proof came and what was chosen", () => {
  const n = renderNotice(
    "submission",
    { name: "Lucas", title: "Arrumar o quarto", photos: 1, report: "text", rewardKind: "time", rewardAmount: 30 },
    "pt",
  );
  assert.equal(n.title, "Lucas entregou “Arrumar o quarto”");
  assert.equal(n.body, "1 foto + relato. Escolheu 30 min de tela.");
});

test("renderNotice — redo quotes the guardian, or falls back", () => {
  assert.equal(renderNotice("rejected", { title: "Louça", message: "Faltaram as panelas." }, "pt").body, "“Faltaram as panelas.”");
  assert.match(renderNotice("rejected", { title: "Louça", message: "" }, "en").body, /redo/);
});

test("renderNotice — unknown kind is harmless", () => {
  assert.deepEqual(renderNotice("nope", {}, "pt"), { title: "QuestVault", body: "" });
});

test("penalty notice — amounts and reason", () => {
  assert.equal(penaltyLabel({ coins: 50, minutes: 30 }, "pt"), "−50 moedas e −30 min de tela");
  assert.equal(penaltyLabel({ coins: 0, minutes: 30 }, "en"), "−30 min of screen time");
  const n = renderNotice("penalty", { coins: 50, minutes: 0, reason: "Brigou com a irmã" }, "pt");
  assert.equal(n.title, "Penalidade: −50 moedas");
  assert.equal(n.body, "“Brigou com a irmã”");
  assert.equal(renderNotice("penalty", { coins: 0, minutes: 15 }, "en").body, "Your guardian left you an audio message.");
});
