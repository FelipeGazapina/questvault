import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdventurer, requireGuardian } from "./access";
import type { NoticeKind, NoticeParams } from "./pushMessages";
import { quietDelayMs } from "./rules";

type Audience = { audience: "guardian" } | { audience: "adventurer"; adventurerId: Id<"adventurers"> };

/**
 * Record a notice in the inbox and schedule its Web Push. Pushes wait out quiet hours:
 * the guardian's own silence window, or the family bedtime for adventurers.
 */
export async function notify(
  ctx: MutationCtx,
  family: Doc<"families">,
  to: Audience,
  kind: NoticeKind,
  params: NoticeParams,
  extra: { runId?: Id<"missionRuns">; purchaseId?: Id<"purchases">; delayMs?: number } = {},
): Promise<void> {
  const now = Date.now();
  await ctx.db.insert("notifications", {
    familyId: family._id,
    audience: to.audience,
    adventurerId: to.audience === "adventurer" ? to.adventurerId : undefined,
    kind,
    params,
    runId: extra.runId,
    purchaseId: extra.purchaseId,
    createdAt: now,
  });

  const recipients =
    to.audience === "guardian"
      ? (await ctx.db.query("users").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect()).filter(
          (u) => u.role === "guardian",
        )
      : await ctx.db.query("users").withIndex("by_adventurer", (q) => q.eq("adventurerId", to.adventurerId)).collect();
  if (recipients.length === 0) return;

  const base = extra.delayMs ?? 0;
  const quiet =
    to.audience === "guardian"
      ? quietDelayMs(now + base, family.settings.tzOffsetMin, family.guardianPrefs.quietStart, family.guardianPrefs.quietEnd)
      : quietDelayMs(now + base, family.settings.tzOffsetMin, family.settings.bedtimeStart, family.settings.bedtimeEnd);

  await ctx.scheduler.runAfter(base + quiet, internal.pushActions.deliverPush, {
    userIds: recipients.map((u) => u._id),
    kind,
    params,
    tag: extra.runId ? `run-${extra.runId}` : kind,
  });
}

const noticeV = v.object({
  _id: v.id("notifications"),
  kind: v.string(),
  params: v.record(v.string(), v.union(v.string(), v.number())),
  runId: v.optional(v.id("missionRuns")),
  purchaseId: v.optional(v.id("purchases")),
  createdAt: v.number(),
  read: v.boolean(),
});

/** Guardian inbox, newest first. */
export const guardianInbox = query({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ items: v.array(noticeV), unread: v.number() }),
  handler: async (ctx, { limit }) => {
    const { family } = await requireGuardian(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_family_audience", (q) => q.eq("familyId", family._id).eq("audience", "guardian"))
      .order("desc")
      .take(Math.min(limit ?? 60, 200));
    return {
      items: rows.map((r) => ({
        _id: r._id,
        kind: r.kind,
        params: r.params,
        runId: r.runId,
        purchaseId: r.purchaseId,
        createdAt: r.createdAt,
        read: r.readAt !== undefined,
      })),
      unread: rows.filter((r) => r.readAt === undefined).length,
    };
  },
});

export const markGuardianInboxRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { family } = await requireGuardian(ctx);
    const now = Date.now();
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_family_audience", (q) => q.eq("familyId", family._id).eq("audience", "guardian"))
      .order("desc")
      .take(200);
    for (const r of rows) if (r.readAt === undefined) await ctx.db.patch(r._id, { readAt: now });
    return null;
  },
});

/** Adventurer notices (shown as a list on the time screen and used for badges). */
export const adventurerInbox = query({
  args: { adventurerId: v.id("adventurers") },
  returns: v.array(noticeV),
  handler: async (ctx, { adventurerId }) => {
    await requireAdventurer(ctx, adventurerId);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId))
      .order("desc")
      .take(30);
    return rows.map((r) => ({
      _id: r._id,
      kind: r.kind,
      params: r.params,
      runId: r.runId,
      purchaseId: r.purchaseId,
      createdAt: r.createdAt,
      read: r.readAt !== undefined,
    }));
  },
});
