import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdventurer, requireGuardian } from "./access";
import { notify } from "./notify";
import { penalizeTime } from "./rules";

/** Debt rows never expire; they're cleared as new time pays them off. */
const NEVER = 8_640_000_000_000_000;
const MAX_COINS = 10_000;
const MAX_MINUTES = 24 * 60;
const MAX_REASON = 280;

/**
 * Guardian takes coins and/or screen minutes from an adventurer, with a reason in text or audio.
 * Balances may go negative: coins recover with the next rewards, time debt is paid by new time first.
 */
export const apply = mutation({
  args: {
    adventurerId: v.id("adventurers"),
    coins: v.number(),
    minutes: v.number(),
    reason: v.optional(v.string()),
    audioId: v.optional(v.id("_storage")),
    audioSeconds: v.optional(v.number()),
  },
  returns: v.id("penalties"),
  handler: async (ctx, args) => {
    const { family } = await requireGuardian(ctx);
    const { adventurer } = await requireAdventurer(ctx, args.adventurerId);
    const coins = Math.round(args.coins);
    const minutes = Math.round(args.minutes);
    if (coins < 0 || coins > MAX_COINS || minutes < 0 || minutes > MAX_MINUTES) throw new Error("Invalid amount");
    if (coins === 0 && minutes === 0) throw new Error("PENALTY_EMPTY");
    const reason = args.reason?.trim().slice(0, MAX_REASON) || undefined;
    if (!reason && !args.audioId) throw new Error("PENALTY_REASON");
    if (args.audioId) {
      const audioId = args.audioId;
      const claim = await ctx.db.query("uploads").withIndex("by_storage", (q) => q.eq("storageId", audioId)).unique();
      if (!claim || claim.familyId !== family._id) throw new Error("Audio not found");
    }

    const now = Date.now();
    if (coins > 0) await ctx.db.patch(adventurer._id, { coins: adventurer.coins - coins });
    if (minutes > 0) {
      const grants = await ctx.db.query("timeGrants").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurer._id)).collect();
      const { remaining, debt } = penalizeTime(grants, minutes, now);
      for (let i = 0; i < grants.length; i += 1) {
        if (remaining[i] !== grants[i].remaining) await ctx.db.patch(grants[i]._id, { remaining: remaining[i] });
      }
      if (debt > 0) {
        await ctx.db.insert("timeGrants", {
          familyId: family._id,
          adventurerId: adventurer._id,
          minutes: -debt,
          remaining: -debt,
          expiresAt: NEVER,
          source: "penalty",
          createdAt: now,
        });
      }
    }

    const penaltyId = await ctx.db.insert("penalties", {
      familyId: family._id,
      adventurerId: adventurer._id,
      coins,
      minutes,
      reason,
      audioId: args.audioId,
      audioSeconds: args.audioId ? args.audioSeconds : undefined,
      createdAt: now,
    });
    await notify(ctx, family, { audience: "adventurer", adventurerId: adventurer._id }, "penalty", {
      coins,
      minutes,
      ...(reason ? { reason } : {}),
    });
    return penaltyId;
  },
});

/** Penalties the adventurer hasn't acknowledged yet — shown as a dialog, oldest first. */
export const unseen = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    await requireAdventurer(ctx, adventurerId);
    // Unseen rows only, oldest first — acknowledged ones never crowd older unseen ones out.
    const pending = await ctx.db
      .query("penalties")
      .withIndex("by_adventurer_seen", (q) => q.eq("adventurerId", adventurerId).eq("seenAt", undefined))
      .take(50);
    return await Promise.all(
      pending.map(async (p) => ({
        _id: p._id,
        coins: p.coins,
        minutes: p.minutes,
        reason: p.reason ?? null,
        audioUrl: p.audioId ? await ctx.storage.getUrl(p.audioId) : null,
        audioSeconds: p.audioSeconds ?? null,
        createdAt: p.createdAt,
      })),
    );
  },
});

export const markSeen = mutation({
  args: { penaltyId: v.id("penalties") },
  returns: v.null(),
  handler: async (ctx, { penaltyId }) => {
    const p = await ctx.db.get(penaltyId);
    if (!p) return null;
    await requireAdventurer(ctx, p.adventurerId);
    if (!p.seenAt) await ctx.db.patch(penaltyId, { seenAt: Date.now() });
    return null;
  },
});

/** Guardian: the adventurer's latest penalties, newest first. */
export const recent = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    await requireGuardian(ctx);
    await requireAdventurer(ctx, adventurerId);
    const rows = await ctx.db
      .query("penalties")
      .withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId))
      .order("desc")
      .take(5);
    return rows.map((p) => ({
      _id: p._id,
      coins: p.coins,
      minutes: p.minutes,
      reason: p.reason ?? null,
      hasAudio: !!p.audioId,
      createdAt: p.createdAt,
      seen: !!p.seenAt,
    }));
  },
});
