"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

function vapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

function configureVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

/** Send Web Push to all subscriptions for a user (standard protocol — no Firebase/OneSignal). */
export const deliverPeriodPush = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    questType: v.union(v.literal("daily"), v.literal("side"), v.literal("boss")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!vapidConfigured()) {
      console.warn("push: VAPID keys not configured — skipping delivery");
      return null;
    }

    configureVapid();

    const subscriptions = await ctx.runQuery(internal.push.listSubscriptionsForUser, {
      userId: args.userId,
    });

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: "/",
      questType: args.questType,
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.push.deletePushSubscription, {
            subscriptionId: sub._id,
          });
        } else {
          console.error("push delivery failed:", status, error);
        }
      }
    }

    return null;
  },
});
