import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
} from "./_generated/server";
import { periodKeyFor, type QuestType } from "./game";
import {
  normalizePushLocale,
  pushNotificationContent,
  shouldSendPeriodPush,
} from "./pushMessages";
import { spawnForType } from "./questSpawn";
import { requireUser } from "./users";

const QUEST_TYPES: QuestType[] = ["daily", "side", "boss"];

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
      if (existing.userId !== user._id) {
        throw new Error("Subscription belongs to another user");
      }
      await ctx.db.patch(existing._id, {
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

export const processUserPeriodPushes = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    if (subscriptions.length === 0) return null;

    const locale = normalizePushLocale(subscriptions[0]?.locale);

    for (const questType of QUEST_TYPES) {
      const periodKey = periodKeyFor(questType);
      const alreadySent = await ctx.db
        .query("pushPeriodDispatches")
        .withIndex("by_user_type_period", (q) =>
          q.eq("userId", args.userId).eq("questType", questType).eq("periodKey", periodKey),
        )
        .unique();

      const spawnedCount = await spawnForType(ctx, args.userId, questType);
      if (
        !shouldSendPeriodPush({
          spawnedCount,
          alreadySent: alreadySent !== null,
        })
      ) {
        continue;
      }

      const content = pushNotificationContent(questType, locale);
      await ctx.db.insert("pushPeriodDispatches", {
        userId: args.userId,
        questType,
        periodKey,
        sentAt: Date.now(),
      });

      await ctx.scheduler.runAfter(0, internal.pushActions.deliverPeriodPush, {
        userId: args.userId,
        title: content.title,
        body: content.body,
        questType,
      });
    }

    return null;
  },
});

/** Hourly: spawn new-period quests and notify subscribed PWA users. */
export const runPeriodPushCron = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("pushSubscriptions").collect();
    const userIds = [...new Set(subscriptions.map((s) => s.userId))];

    for (const userId of userIds) {
      await ctx.scheduler.runAfter(0, internal.push.processUserPeriodPushes, { userId });
    }

    return null;
  },
});
