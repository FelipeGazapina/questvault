import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { formatDue, rewardParams, syncRunsFor } from "./missions";
import { notify } from "./notify";
import { hhmmToMinutes, localParts } from "./rules";

const MIN = 60_000;
const HOUR = 3_600_000;
/** Child deadline warning lead time — matches the design's "Faltam 30 min". */
const CHILD_DEADLINE_WARN_MIN = 30;

/**
 * Every few minutes: spawn runs whose appear time arrived (and announce them), warn about
 * deadlines, remind the guardian of waiting deliveries, and send the daily summary.
 */
export const run = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const families = await ctx.db.query("families").collect();

    for (const family of families) {
      const tz = family.settings.tzOffsetMin;
      const prefs = family.guardianPrefs;
      const advs = (await ctx.db.query("adventurers").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect()).filter(
        (a) => !a.archived,
      );
      const names = new Map(advs.map((a) => [a._id as string, a.name]));

      for (const adv of advs) await syncRunsFor(ctx, family, adv, now, true);

      // Deadline warnings — child always (30 min), guardian per preference.
      const todo = await ctx.db
        .query("missionRuns")
        .withIndex("by_family_status", (q) => q.eq("familyId", family._id).eq("status", "todo"))
        .collect();
      for (const r of todo) {
        const left = r.dueAt - now;
        if (left <= 0 || !names.has(r.adventurerId)) continue;
        if (!r.deadlineWarnedAt && left <= CHILD_DEADLINE_WARN_MIN * MIN) {
          await notify(ctx, family, { audience: "adventurer", adventurerId: r.adventurerId }, "deadline_child", {
            title: r.title,
            minutes: Math.max(1, Math.round(left / MIN)),
            ...rewardParams(r),
          }, { runId: r._id });
          await ctx.db.patch(r._id, { deadlineWarnedAt: now });
        }
        if (!r.guardianWarnedAt && prefs.deadlineWarnMin > 0 && left <= prefs.deadlineWarnMin * MIN) {
          await notify(ctx, family, { audience: "guardian" }, "deadline_guardian", {
            name: names.get(r.adventurerId) ?? "",
            title: r.title,
            due: formatDue(r.dueAt, tz),
          }, { runId: r._id });
          await ctx.db.patch(r._id, { guardianWarnedAt: now });
        }
      }

      // Waiting deliveries reminder.
      if (prefs.pendingReminderHours > 0) {
        const submitted = await ctx.db
          .query("missionRuns")
          .withIndex("by_family_status", (q) => q.eq("familyId", family._id).eq("status", "submitted"))
          .collect();
        for (const r of submitted) {
          if (r.reminderSentAt || !r.submittedAt) continue;
          if (now - r.submittedAt < prefs.pendingReminderHours * HOUR) continue;
          await notify(ctx, family, { audience: "guardian" }, "pending_reminder", {
            name: names.get(r.adventurerId) ?? "",
            title: r.title,
            hours: prefs.pendingReminderHours,
          }, { runId: r._id });
          await ctx.db.patch(r._id, { reminderSentAt: now });
        }
      }

      // Daily summary.
      const local = localParts(now, tz);
      if (prefs.dailySummary && family.lastSummaryDate !== local.date && local.minutes >= hhmmToMinutes(prefs.dailySummary, 1440)) {
        let approved = 0;
        let rejected = 0;
        let minutes = 0;
        for (const adv of advs) {
          const runs = await ctx.db.query("missionRuns").withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id)).order("desc").take(100);
          for (const r of runs) {
            if (!r.decidedAt || localParts(r.decidedAt, tz).date !== local.date) continue;
            if (r.status === "approved") approved += 1;
            if (r.status === "rejected") rejected += 1;
          }
          const sessions = await ctx.db.query("screenSessions").withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id)).order("desc").take(50);
          minutes += sessions.filter((s) => localParts(s.startedAt, tz).date === local.date).reduce((sum, s) => sum + s.minutes, 0);
        }
        await ctx.db.patch(family._id, { lastSummaryDate: local.date });
        if (advs.length > 0) {
          await notify(ctx, family, { audience: "guardian" }, "daily_summary", { approved, rejected, minutes });
        }
      }
    }
    return null;
  },
});
