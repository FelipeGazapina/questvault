import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdventurer, requireGuardian } from "./access";
import { notify } from "./notify";
import { COIN_BLOCK, localParts, settleTimeDebt, spendTime } from "./rules";

const DAY = 86_400_000;
const MIN = 60_000;
/** "Restam 5 min de tela" fires this long before a session ends. */
const TIME_LOW_WARN_MIN = 5;

// ─── Catalog (guardian) ───────────────────────────────────────────────────

export const catalog = query({
  args: {},
  handler: async (ctx) => {
    const { family } = await requireGuardian(ctx);
    const items = await ctx.db.query("shopItems").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect();
    const packs = await ctx.db.query("timePacks").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect();
    const advs = (await ctx.db.query("adventurers").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect()).filter(
      (a) => !a.archived,
    );
    return {
      items: items.sort((a, b) => a.priceCoins - b.priceCoins),
      packs: packs.sort((a, b) => a.minutes - b.minutes),
      settings: family.settings,
      cofres: advs.map((a) => ({ _id: a._id, name: a.name, cofreCents: a.cofreCents })),
    };
  },
});

export const saveItem = mutation({
  args: { itemId: v.optional(v.id("shopItems")), title: v.string(), priceCoins: v.number(), active: v.boolean() },
  returns: v.id("shopItems"),
  handler: async (ctx, { itemId, title, priceCoins, active }) => {
    const { family } = await requireGuardian(ctx);
    const clean = title.trim().slice(0, 60);
    const price = Math.round(priceCoins);
    if (!clean || price <= 0) throw new Error("Title and price required");
    if (itemId) {
      const item = await ctx.db.get(itemId);
      if (!item || item.familyId !== family._id) throw new Error("Item not found");
      await ctx.db.patch(itemId, { title: clean, priceCoins: price, active });
      return itemId;
    }
    return await ctx.db.insert("shopItems", { familyId: family._id, title: clean, priceCoins: price, active, createdAt: Date.now() });
  },
});

export const savePack = mutation({
  args: { packId: v.optional(v.id("timePacks")), minutes: v.number(), priceCoins: v.number(), active: v.boolean() },
  returns: v.id("timePacks"),
  handler: async (ctx, { packId, minutes, priceCoins, active }) => {
    const { family } = await requireGuardian(ctx);
    const mins = Math.round(minutes);
    const price = Math.round(priceCoins);
    if (mins <= 0 || price <= 0) throw new Error("Minutes and price required");
    if (packId) {
      const pack = await ctx.db.get(packId);
      if (!pack || pack.familyId !== family._id) throw new Error("Pack not found");
      await ctx.db.patch(packId, { minutes: mins, priceCoins: price, active });
      return packId;
    }
    return await ctx.db.insert("timePacks", { familyId: family._id, minutes: mins, priceCoins: price, active });
  },
});

export const deletePack = mutation({
  args: { packId: v.id("timePacks") },
  returns: v.null(),
  handler: async (ctx, { packId }) => {
    const { family } = await requireGuardian(ctx);
    const pack = await ctx.db.get(packId);
    if (pack && pack.familyId === family._id) await ctx.db.delete(packId);
    return null;
  },
});

// ─── Purchases ────────────────────────────────────────────────────────────

export const pendingPurchases = query({
  args: {},
  handler: async (ctx) => {
    const { family } = await requireGuardian(ctx);
    const rows = await ctx.db.query("purchases").withIndex("by_family", (q) => q.eq("familyId", family._id)).order("desc").take(100);
    const out = [];
    for (const p of rows.filter((r) => r.status === "pending")) {
      const adv = await ctx.db.get(p.adventurerId);
      out.push({ ...p, adventurerName: adv?.name ?? "" });
    }
    return out;
  },
});

export const markDelivered = mutation({
  args: { purchaseId: v.id("purchases") },
  returns: v.null(),
  handler: async (ctx, { purchaseId }) => {
    const { family } = await requireGuardian(ctx);
    const p = await ctx.db.get(purchaseId);
    if (!p || p.familyId !== family._id) throw new Error("Purchase not found");
    await ctx.db.patch(purchaseId, { status: "delivered", deliveredAt: Date.now() });
    return null;
  },
});

// ─── Adventurer market ────────────────────────────────────────────────────

export const market = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    const { family, adventurer } = await requireAdventurer(ctx, adventurerId);
    const items = (await ctx.db.query("shopItems").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect())
      .filter((i) => i.active)
      .sort((a, b) => a.priceCoins - b.priceCoins);
    const packs = (await ctx.db.query("timePacks").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect())
      .filter((p) => p.active)
      .sort((a, b) => a.minutes - b.minutes);
    const purchases = (
      await ctx.db.query("purchases").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).order("desc").take(20)
    ).filter((p) => p.kind !== "time");
    return {
      coins: adventurer.coins,
      cofreCents: adventurer.cofreCents,
      allowanceEnabled: family.settings.allowanceEnabled,
      coinRateCents: family.settings.coinRateCents,
      items,
      packs,
      purchases,
    };
  },
});

async function charge(ctx: MutationCtx, adv: Doc<"adventurers">, price: number) {
  if (adv.coins < price) throw new Error("NOT_ENOUGH_COINS");
  await ctx.db.patch(adv._id, { coins: adv.coins - price });
}

/**
 * Bank new screen minutes. Time debt from penalties is paid off first; only what's left
 * becomes spendable (the grant row keeps the full `minutes` for history).
 */
export async function grantTime(
  ctx: MutationCtx,
  family: Doc<"families">,
  adventurerId: Id<"adventurers">,
  minutes: number,
  source: Exclude<Doc<"timeGrants">["source"], "penalty">,
) {
  const now = Date.now();
  const debts = (await ctx.db.query("timeGrants").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).collect())
    .filter((g) => g.source === "penalty" && g.remaining < 0)
    .sort((a, b) => a.createdAt - b.createdAt);
  const settled = settleTimeDebt(
    debts.map((d) => -d.remaining),
    minutes,
  );
  for (let i = 0; i < debts.length; i += 1) {
    const owed = settled.debts[i];
    if (owed === 0) await ctx.db.delete(debts[i]._id);
    else if (owed !== -debts[i].remaining) await ctx.db.patch(debts[i]._id, { remaining: -owed });
  }
  await ctx.db.insert("timeGrants", {
    familyId: family._id,
    adventurerId,
    minutes,
    remaining: settled.left,
    expiresAt: now + family.settings.timeExpiryDays * DAY,
    source,
    createdAt: now,
  });
}

export const buyItem = mutation({
  args: { adventurerId: v.id("adventurers"), itemId: v.id("shopItems") },
  returns: v.null(),
  handler: async (ctx, { adventurerId, itemId }) => {
    const { family, adventurer } = await requireAdventurer(ctx, adventurerId);
    const item = await ctx.db.get(itemId);
    if (!item || item.familyId !== family._id || !item.active) throw new Error("Item not available");
    await charge(ctx, adventurer, item.priceCoins);
    const purchaseId = await ctx.db.insert("purchases", {
      familyId: family._id,
      adventurerId,
      kind: "item",
      title: item.title,
      priceCoins: item.priceCoins,
      status: "pending",
      createdAt: Date.now(),
    });
    if (family.guardianPrefs.shopPurchase) {
      await notify(ctx, family, { audience: "guardian" }, "purchase", {
        name: adventurer.name,
        title: item.title,
        price: item.priceCoins,
      }, { purchaseId });
    }
    return null;
  },
});

export const buyPack = mutation({
  args: { adventurerId: v.id("adventurers"), packId: v.id("timePacks") },
  returns: v.null(),
  handler: async (ctx, { adventurerId, packId }) => {
    const { family, adventurer } = await requireAdventurer(ctx, adventurerId);
    const pack = await ctx.db.get(packId);
    if (!pack || pack.familyId !== family._id || !pack.active) throw new Error("Pack not available");
    await charge(ctx, adventurer, pack.priceCoins);
    await grantTime(ctx, family, adventurerId, pack.minutes, "shop");
    await ctx.db.insert("purchases", {
      familyId: family._id,
      adventurerId,
      kind: "time",
      title: `${pack.minutes} min`,
      priceCoins: pack.priceCoins,
      minutes: pack.minutes,
      status: "delivered",
      createdAt: Date.now(),
      deliveredAt: Date.now(),
    });
    return null;
  },
});

/** Allowance: trade blocks of 100 coins for real money in the adventurer's cofre. */
export const exchangeCoins = mutation({
  args: { adventurerId: v.id("adventurers"), blocks: v.number() },
  returns: v.null(),
  handler: async (ctx, { adventurerId, blocks }) => {
    const { family, adventurer } = await requireAdventurer(ctx, adventurerId);
    if (!family.settings.allowanceEnabled) throw new Error("Allowance is off");
    const n = Math.floor(blocks);
    if (n <= 0) throw new Error("Nothing to exchange");
    const coins = n * COIN_BLOCK;
    if (adventurer.coins < coins) throw new Error("NOT_ENOUGH_COINS");
    await ctx.db.patch(adventurerId, {
      coins: adventurer.coins - coins,
      cofreCents: adventurer.cofreCents + n * family.settings.coinRateCents,
    });
    return null;
  },
});

// ─── Screen time ──────────────────────────────────────────────────────────

/** Guardian gift ("Dar tempo"). */
export const giveTime = mutation({
  args: { adventurerId: v.id("adventurers"), minutes: v.number() },
  returns: v.null(),
  handler: async (ctx, { adventurerId, minutes }) => {
    const { family } = await requireGuardian(ctx);
    await requireAdventurer(ctx, adventurerId);
    const mins = Math.round(minutes);
    if (mins <= 0 || mins > 600) throw new Error("Invalid minutes");
    await grantTime(ctx, family, adventurerId, mins, "gift");
    await notify(ctx, family, { audience: "adventurer", adventurerId }, "time_gift", { minutes: mins });
    return null;
  },
});

/**
 * Spend banked minutes to open "time" apps now. Enforces the family's daily cap and
 * schedules the "5 min left" warning. Actual app unlocking is done by the native companion.
 */
export const startScreenTime = mutation({
  args: { adventurerId: v.id("adventurers"), minutes: v.number() },
  returns: v.object({ endsAt: v.number() }),
  handler: async (ctx, { adventurerId, minutes }) => {
    const { family } = await requireAdventurer(ctx, adventurerId);
    const mins = Math.round(minutes);
    if (mins <= 0) throw new Error("Invalid minutes");
    const now = Date.now();
    const tz = family.settings.tzOffsetMin;
    const today = localParts(now, tz).date;

    const sessions = await ctx.db.query("screenSessions").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).order("desc").take(50);
    if (sessions.some((s) => s.endsAt > now)) throw new Error("SESSION_ACTIVE");
    const usedToday = sessions.filter((s) => localParts(s.startedAt, tz).date === today).reduce((sum, s) => sum + s.minutes, 0);
    if (usedToday + mins > family.settings.maxDailyScreenMin) throw new Error("DAILY_CAP");

    const grants = await ctx.db.query("timeGrants").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).collect();
    const next = spendTime(grants, mins, now);
    if (!next) throw new Error("NOT_ENOUGH_TIME");
    for (let i = 0; i < grants.length; i += 1) {
      if (next[i] !== grants[i].remaining) await ctx.db.patch(grants[i]._id, { remaining: next[i] });
    }
    const endsAt = now + mins * MIN;
    const sessionId = await ctx.db.insert("screenSessions", { familyId: family._id, adventurerId, minutes: mins, startedAt: now, endsAt });
    if (mins > TIME_LOW_WARN_MIN) {
      await ctx.scheduler.runAt(endsAt - TIME_LOW_WARN_MIN * MIN, internal.rewards.warnTimeLow, { sessionId });
    }
    return { endsAt };
  },
});

export const warnTimeLow = internalMutation({
  args: { sessionId: v.id("screenSessions") },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.endsAt <= Date.now()) return null;
    const family = await ctx.db.get(session.familyId);
    if (!family) return null;
    await notify(ctx, family, { audience: "adventurer", adventurerId: session.adventurerId }, "time_low", {
      minutes: TIME_LOW_WARN_MIN,
    });
    return null;
  },
});
