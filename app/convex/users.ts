import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

/** Resolve the signed-in user or throw. Shared by all game functions. */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
  },
});

/** Initialize game state for a fresh auth user (idempotent). Called after sign-in.
 * No starter quests: v1 rule — every quest on the board is forged by the user. */
export const ensureGameUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.level !== undefined) return;
    await ctx.db.patch(user._id, {
      tier: "stickers",
      xp: 0,
      level: 1,
      streak: 0,
      lockedGold: 0,
      spendableGold: 0,
      convertedToday: 0,
      waitlist: false,
    });
  },
});

export const setTier = mutation({
  args: {
    tier: v.union(v.literal("xp"), v.literal("stickers"), v.literal("loot")),
  },
  handler: async (ctx, { tier }) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { tier });
  },
});

export const setName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { name: name.trim().slice(0, 12).toUpperCase() || "HERO" });
  },
});

export const joinWaitlist = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, { waitlist: true });
  },
});
