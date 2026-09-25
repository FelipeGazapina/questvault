import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { requireUser } from "./access";

const subscriptionArgs = {
  endpoint: v.string(),
  p256dh: v.string(),
  auth: v.string(),
  locale: v.optional(v.string()),
};

/** Save or refresh a Web Push subscription from the PWA client. */
export const registerPushSubscription = mutation({
  args: subscriptionArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      // A browser endpoint follows whoever is signed in on it now (e.g. a device re-paired to a child).
      await ctx.db.patch(existing._id, {
        userId: user._id,
        p256dh: args.p256dh,
        auth: args.auth,
        locale: args.locale,
      });
      return null;
    }

    await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      locale: args.locale,
      createdAt: Date.now(),
    });
    return null;
  },
});

/** Remove push subscription (user disabled notifications). */
export const removePushSubscription = mutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing && existing.userId === user._id) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const listSubscriptionsForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("pushSubscriptions"),
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
      locale: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return rows.map((row) => ({
      _id: row._id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      locale: row.locale,
    }));
  },
});

export const deletePushSubscription = internalMutation({
  args: { subscriptionId: v.id("pushSubscriptions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
    return null;
  },
});
