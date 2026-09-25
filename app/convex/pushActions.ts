"use node";

import webpush from "web-push";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { normalizePushLocale, renderNotice } from "./pushMessages";

function vapidConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

/** Send one notice as Web Push to every subscription of the given users, each in its own locale. */
export const deliverPush = internalAction({
  args: {
    userIds: v.array(v.id("users")),
    kind: v.string(),
    params: v.record(v.string(), v.union(v.string(), v.number())),
    tag: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!vapidConfigured()) {
      console.warn("push: VAPID keys not configured — skipping delivery");
      return null;
    }
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    for (const userId of args.userIds) {
      const subscriptions = await ctx.runQuery(internal.push.listSubscriptionsForUser, { userId });
      for (const sub of subscriptions) {
        const { title, body } = renderNotice(args.kind, args.params, normalizePushLocale(sub.locale));
        const payload = JSON.stringify({ title, body, url: "/", tag: args.tag });
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await ctx.runMutation(internal.push.deletePushSubscription, { subscriptionId: sub._id });
          } else {
            console.error("push delivery failed:", status, error);
          }
        }
      }
    }
    return null;
  },
});
