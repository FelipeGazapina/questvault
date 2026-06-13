import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./users";

// Phase 1: play-gold only. No real money anywhere in this file (see docs/07-roadmap.md).

export const deposit = mutation({
  args: { amountCents: v.number() },
  handler: async (ctx, { amountCents }) => {
    if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1_000_000) {
      throw new Error("Invalid amount");
    }
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { lockedGold: (user.lockedGold ?? 0) + amountCents });
    await ctx.db.insert("ledger", {
      userId: user._id,
      entryType: "deposit",
      amountCents,
      description: "Play-gold stashed",
    });
  },
});

// R2: withdrawal is always possible and always free — even for play-gold,
// the mechanic ships in Phase 1 so the promise is part of the product from day one.
export const withdrawAll = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const total = (user.lockedGold ?? 0) + (user.spendableGold ?? 0);
    if (total <= 0) throw new Error("Vault is empty");
    await ctx.db.patch(user._id, { lockedGold: 0, spendableGold: 0 });
    await ctx.db.insert("ledger", {
      userId: user._id,
      entryType: "withdraw",
      amountCents: total,
      description: "Left the dungeon — full withdrawal",
    });
  },
});

export const ledgerList = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("ledger")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(25);
  },
});
