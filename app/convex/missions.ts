import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { requireAdventurer, requireFamily, requireGuardian } from "./access";
import { notify } from "./notify";
import { grantTime } from "./rewards";
import {
  allowedChoices,
  applyXp,
  DIFFICULTY_XP,
  dueAtFor,
  hhmmToMinutes,
  localParts,
  nextStreak,
  periodKeyFor,
  shouldSpawn,
  type ChosenReward,
} from "./rules";
import { chosenRewardV, difficultyV, frequencyV, rewardTypeV } from "./schema";

const DAY = 86_400_000;

// ─── Guardian: mission templates ──────────────────────────────────────────

const missionFields = {
  title: v.string(),
  description: v.optional(v.string()),
  assignees: v.array(v.id("adventurers")),
  frequency: frequencyV,
  appearTime: v.string(),
  dueTime: v.string(),
  requirePhoto: v.boolean(),
  requireReport: v.boolean(),
  rewardType: rewardTypeV,
  coins: v.number(),
  minutes: v.number(),
  itemId: v.optional(v.id("shopItems")),
  difficulty: difficultyV,
};

type MissionInput = {
  title: string;
  description?: string;
  assignees: Id<"adventurers">[];
  frequency: Doc<"missions">["frequency"];
  appearTime: string;
  dueTime: string;
  requirePhoto: boolean;
  requireReport: boolean;
  rewardType: Doc<"missions">["rewardType"];
  coins: number;
  minutes: number;
  itemId?: Id<"shopItems">;
  difficulty: Doc<"missions">["difficulty"];
};

async function validateMission(ctx: MutationCtx, family: Doc<"families">, m: MissionInput) {
  const title = m.title.trim().slice(0, 80);
  if (!title) throw new Error("Title required");
  if (m.assignees.length === 0) throw new Error("Pick at least one adventurer");
  for (const id of m.assignees) {
    const a = await ctx.db.get(id);
    if (!a || a.familyId !== family._id || a.archived) throw new Error("Unknown adventurer");
  }
  if (hhmmToMinutes(m.dueTime, -1) < 0 || hhmmToMinutes(m.appearTime, -1) < 0) throw new Error("Invalid time");
  const coins = Math.max(0, Math.round(m.coins));
  const minutes = Math.max(0, Math.round(m.minutes));
  if ((m.rewardType === "coins" || m.rewardType === "choice") && coins <= 0) throw new Error("Set the coins");
  if ((m.rewardType === "time" || m.rewardType === "choice") && minutes <= 0) throw new Error("Set the minutes");
  if (m.rewardType === "item") {
    if (!m.itemId) throw new Error("Pick an item");
    const item = await ctx.db.get(m.itemId);
    if (!item || item.familyId !== family._id) throw new Error("Unknown item");
  }
  return {
    ...m,
    title,
    description: m.description?.trim().slice(0, 400) || undefined,
    coins,
    minutes,
    itemId: m.rewardType === "item" ? m.itemId : undefined,
    xp: DIFFICULTY_XP[m.difficulty],
  };
}

export const listMissions = query({
  args: {},
  handler: async (ctx) => {
    const { family } = await requireGuardian(ctx);
    const missions = await ctx.db.query("missions").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect();
    return missions.sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt - a.createdAt);
  },
});

export const getMission = query({
  args: { missionId: v.id("missions") },
  handler: async (ctx, { missionId }) => {
    const { family } = await requireGuardian(ctx);
    const m = await ctx.db.get(missionId);
    return m && m.familyId === family._id ? m : null;
  },
});

export const createMission = mutation({
  args: missionFields,
  returns: v.id("missions"),
  handler: async (ctx, args) => {
    const { family } = await requireGuardian(ctx);
    const clean = await validateMission(ctx, family, args);
    const id = await ctx.db.insert("missions", { ...clean, familyId: family._id, active: true, createdAt: Date.now() });
    for (const advId of clean.assignees) {
      const adv = await ctx.db.get(advId);
      if (adv) await syncRunsFor(ctx, family, adv, Date.now(), true);
    }
    return id;
  },
});

export const updateMission = mutation({
  args: { missionId: v.id("missions"), ...missionFields },
  returns: v.null(),
  handler: async (ctx, { missionId, ...args }) => {
    const { family } = await requireGuardian(ctx);
    const existing = await ctx.db.get(missionId);
    if (!existing || existing.familyId !== family._id) throw new Error("Mission not found");
    const clean = await validateMission(ctx, family, args);
    await ctx.db.patch(missionId, clean);
    return null;
  },
});

export const setMissionActive = mutation({
  args: { missionId: v.id("missions"), active: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { missionId, active }) => {
    const { family } = await requireGuardian(ctx);
    const m = await ctx.db.get(missionId);
    if (!m || m.familyId !== family._id) throw new Error("Mission not found");
    await ctx.db.patch(missionId, { active });
    return null;
  },
});

// ─── Spawning runs ────────────────────────────────────────────────────────

/**
 * Create this period's runs for one adventurer (idempotent). Returns how many were created.
 * `announce` sends the "new mission" push — the cron and mission creation announce; the
 * child's own board refresh does not (they are already looking at it).
 */
export async function syncRunsFor(
  ctx: MutationCtx,
  family: Doc<"families">,
  adv: Doc<"adventurers">,
  now: number,
  announce: boolean,
): Promise<number> {
  const tz = family.settings.tzOffsetMin;
  const local = localParts(now, tz);
  const missions = (await ctx.db.query("missions").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect()).filter(
    (m) => m.active && m.assignees.includes(adv._id),
  );
  const created: Doc<"missionRuns">[] = [];
  for (const m of missions) {
    if (!shouldSpawn(m.frequency, local.minutes, m.appearTime)) continue;
    const periodKey = periodKeyFor(m.frequency, local.date);
    const existing = await ctx.db
      .query("missionRuns")
      .withIndex("by_mission_adventurer_period", (q) =>
        q.eq("missionId", m._id).eq("adventurerId", adv._id).eq("periodKey", periodKey),
      )
      .first();
    if (existing) continue;
    let dueAt = dueAtFor(m.frequency, local.date, local.weekday, m.dueTime, tz);
    if (m.frequency === "once" && dueAt <= now) dueAt += DAY;
    const item = m.itemId ? await ctx.db.get(m.itemId) : null;
    const id = await ctx.db.insert("missionRuns", {
      familyId: family._id,
      missionId: m._id,
      adventurerId: adv._id,
      periodKey,
      title: m.title,
      description: m.description,
      frequency: m.frequency,
      dueAt,
      requirePhoto: m.requirePhoto,
      requireReport: m.requireReport,
      rewardType: m.rewardType,
      coins: m.coins,
      minutes: m.minutes,
      itemId: m.itemId,
      itemTitle: item?.title,
      xp: m.xp,
      status: "todo",
      spawnedAt: now,
    });
    const run = await ctx.db.get(id);
    if (run) created.push(run);
  }
  if (announce && created.length === 1) {
    const r = created[0];
    await notify(ctx, family, { audience: "adventurer", adventurerId: adv._id }, "mission_new", {
      title: r.title,
      due: formatDue(r.dueAt, tz),
      ...rewardParams(r),
    }, { runId: r._id });
  } else if (announce && created.length > 1) {
    await notify(ctx, family, { audience: "adventurer", adventurerId: adv._id }, "missions_new", { count: created.length });
  }
  return created.length;
}

/** Child board refresh: spawn anything due now without pushing. */
export const syncBoard = mutation({
  args: { adventurerId: v.id("adventurers") },
  returns: v.null(),
  handler: async (ctx, { adventurerId }) => {
    const { family, adventurer } = await requireAdventurer(ctx, adventurerId);
    await syncRunsFor(ctx, family, adventurer, Date.now(), false);
    return null;
  },
});

// ─── Shared helpers ───────────────────────────────────────────────────────

export function formatDue(dueAt: number, tz: number): string {
  const { minutes } = localParts(dueAt, tz);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Notice params describing a run's reward (the choice, or what was chosen). */
export function rewardParams(r: Doc<"missionRuns">, chosen?: ChosenReward): Record<string, string | number> {
  const kind = chosen ?? r.rewardType;
  if (kind === "coins") return { rewardKind: "coins", rewardAmount: r.coins };
  if (kind === "time") return { rewardKind: "time", rewardAmount: r.minutes };
  if (kind === "item") return { rewardKind: "item", itemTitle: r.itemTitle ?? "" };
  return { rewardKind: "choice", coins: r.coins, minutes: r.minutes };
}

async function runView(ctx: QueryCtx, r: Doc<"missionRuns">) {
  const photoUrls = await Promise.all((r.photoIds ?? []).map((id) => ctx.storage.getUrl(id)));
  const audioUrl = r.audioId ? await ctx.storage.getUrl(r.audioId) : null;
  return {
    _id: r._id,
    missionId: r.missionId,
    adventurerId: r.adventurerId,
    title: r.title,
    description: r.description ?? null,
    frequency: r.frequency,
    dueAt: r.dueAt,
    requirePhoto: r.requirePhoto,
    requireReport: r.requireReport,
    rewardType: r.rewardType,
    coins: r.coins,
    minutes: r.minutes,
    itemTitle: r.itemTitle ?? null,
    xp: r.xp,
    status: r.status,
    photoUrls: photoUrls.filter((u): u is string => !!u),
    reportText: r.reportText ?? null,
    audioUrl,
    audioSeconds: r.audioSeconds ?? null,
    chosenReward: r.chosenReward ?? null,
    submittedAt: r.submittedAt ?? null,
    decidedAt: r.decidedAt ?? null,
    guardianMessage: r.guardianMessage ?? null,
    leveledUpTo: r.leveledUpTo ?? null,
    seenAt: r.seenAt ?? null,
  };
}

export type RunView = Awaited<ReturnType<typeof runView>>;

// ─── Adventurer: board, delivery, decisions ───────────────────────────────

/**
 * What the adventurer sees today: the current period's runs plus anything still in play
 * (waiting for review or asked to redo). Approved runs stay visible for the day they were approved.
 */
export const board = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    const { family } = await requireAdventurer(ctx, adventurerId);
    const tz = family.settings.tzOffsetMin;
    const now = Date.now();
    const local = localParts(now, tz);
    const runs = await ctx.db
      .query("missionRuns")
      .withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId))
      .order("desc")
      .take(200);
    const current = (r: Doc<"missionRuns">) => r.periodKey === periodKeyFor(r.frequency, local.date);
    const visible = runs.filter((r) => {
      if (r.status === "submitted" || r.status === "rejected") return true;
      if (r.status === "approved") return !!r.decidedAt && localParts(r.decidedAt, tz).date === local.date;
      return current(r) && (r.frequency !== "once" || r.dueAt > now - DAY);
    });
    const order = { rejected: 0, todo: 1, submitted: 2, approved: 3 } as const;
    visible.sort((a, b) => order[a.status] - order[b.status] || a.dueAt - b.dueAt);
    const views = await Promise.all(visible.map((r) => runView(ctx, r)));
    return {
      today: views.filter((r) => r.frequency !== "weekly"),
      week: views.filter((r) => r.frequency === "weekly"),
    };
  },
});

export const getRun = query({
  args: { runId: v.id("missionRuns") },
  handler: async (ctx, { runId }) => {
    const { user, family } = await requireFamily(ctx);
    const r = await ctx.db.get(runId);
    if (!r || r.familyId !== family._id) return null;
    if (user.role !== "guardian" && user.adventurerId !== r.adventurerId) return null;
    const adv = await ctx.db.get(r.adventurerId);
    return { ...(await runView(ctx, r)), adventurerName: adv?.name ?? "", crest: adv?.crest ?? "teal" };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireFamily(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitRun = mutation({
  args: {
    runId: v.id("missionRuns"),
    photoIds: v.array(v.id("_storage")),
    reportText: v.optional(v.string()),
    audioId: v.optional(v.id("_storage")),
    audioSeconds: v.optional(v.number()),
    chosenReward: chosenRewardV,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) throw new Error("Mission not found");
    const { family, adventurer } = await requireAdventurer(ctx, run.adventurerId);
    if (run.status !== "todo" && run.status !== "rejected") throw new Error("Already delivered");
    const text = args.reportText?.trim().slice(0, 1000) || undefined;
    if (run.requirePhoto && args.photoIds.length === 0) throw new Error("PHOTO_REQUIRED");
    if (run.requireReport && !text && !args.audioId) throw new Error("REPORT_REQUIRED");
    if (!allowedChoices(run.rewardType).includes(args.chosenReward)) throw new Error("Invalid reward");
    if (args.photoIds.length > 4) throw new Error("Up to 4 photos");

    // A redo replaces the previous proof.
    for (const id of run.photoIds ?? []) if (!args.photoIds.includes(id)) await ctx.storage.delete(id);
    if (run.audioId && run.audioId !== args.audioId) await ctx.storage.delete(run.audioId);

    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "submitted",
      photoIds: args.photoIds,
      reportText: text,
      audioId: args.audioId,
      audioSeconds: args.audioSeconds,
      chosenReward: args.chosenReward,
      submittedAt: now,
      decidedAt: undefined,
      guardianMessage: undefined,
      seenAt: undefined,
      reminderSentAt: undefined,
    });

    if (family.guardianPrefs.newSubmission) {
      await notify(ctx, family, { audience: "guardian" }, "submission", {
        name: adventurer.name,
        title: run.title,
        photos: args.photoIds.length,
        report: args.audioId ? "audio" : text ? "text" : "",
        ...rewardParams(run, args.chosenReward),
      }, { runId: run._id });
    }
    return null;
  },
});

/** Approvals and redos the adventurer hasn't acknowledged yet — shown as a dialog on next open. */
export const unseenDecisions = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    await requireAdventurer(ctx, adventurerId);
    const runs = await ctx.db
      .query("missionRuns")
      .withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId))
      .order("desc")
      .take(100);
    const unseen = runs.filter((r) => (r.status === "approved" || r.status === "rejected") && !r.seenAt && r.decidedAt);
    unseen.sort((a, b) => (a.decidedAt ?? 0) - (b.decidedAt ?? 0));
    return await Promise.all(unseen.map((r) => runView(ctx, r)));
  },
});

export const markSeen = mutation({
  args: { runId: v.id("missionRuns") },
  returns: v.null(),
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get(runId);
    if (!run) return null;
    await requireAdventurer(ctx, run.adventurerId);
    await ctx.db.patch(runId, { seenAt: Date.now() });
    return null;
  },
});

// ─── Guardian: approvals ──────────────────────────────────────────────────

export const approvals = query({
  args: {
    status: v.union(v.literal("submitted"), v.literal("approved"), v.literal("rejected")),
    adventurerId: v.optional(v.id("adventurers")),
  },
  handler: async (ctx, { status, adventurerId }) => {
    const { family } = await requireGuardian(ctx);
    const rows = await ctx.db
      .query("missionRuns")
      .withIndex("by_family_status", (q) => q.eq("familyId", family._id).eq("status", status))
      .order("desc")
      .take(300);
    const since = Date.now() - 14 * DAY;
    const filtered = rows
      .filter((r) => !adventurerId || r.adventurerId === adventurerId)
      .filter((r) => status === "submitted" || (r.decidedAt ?? 0) > since)
      .sort((a, b) =>
        status === "submitted" ? (a.submittedAt ?? 0) - (b.submittedAt ?? 0) : (b.decidedAt ?? 0) - (a.decidedAt ?? 0),
      )
      .slice(0, 50);
    const advs = new Map<string, Doc<"adventurers"> | null>();
    const out = [];
    for (const r of filtered) {
      if (!advs.has(r.adventurerId)) advs.set(r.adventurerId, await ctx.db.get(r.adventurerId));
      const adv = advs.get(r.adventurerId);
      out.push({ ...(await runView(ctx, r)), adventurerName: adv?.name ?? "", crest: adv?.crest ?? "teal" });
    }
    return out;
  },
});

export const pendingCount = query({
  args: {},
  returns: v.object({ count: v.number(), oldestAt: v.union(v.number(), v.null()) }),
  handler: async (ctx) => {
    const { family } = await requireGuardian(ctx);
    const rows = await ctx.db
      .query("missionRuns")
      .withIndex("by_family_status", (q) => q.eq("familyId", family._id).eq("status", "submitted"))
      .collect();
    const oldest = rows.reduce<number | null>((min, r) => (min === null || (r.submittedAt ?? 0) < min ? r.submittedAt ?? 0 : min), null);
    return { count: rows.length, oldestAt: oldest };
  },
});

/** Approve (grant the chosen reward + XP) or ask for a redo. The adventurer is notified either way. */
export const decide = mutation({
  args: { runId: v.id("missionRuns"), approve: v.boolean(), message: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, { runId, approve, message }) => {
    const { family } = await requireGuardian(ctx);
    const run = await ctx.db.get(runId);
    if (!run || run.familyId !== family._id) throw new Error("Mission not found");
    if (run.status !== "submitted") throw new Error("Nothing to decide");
    const adv = await ctx.db.get(run.adventurerId);
    if (!adv) throw new Error("Adventurer not found");
    const now = Date.now();
    const msg = message?.trim().slice(0, 300) || undefined;

    if (!approve) {
      await ctx.db.patch(runId, { status: "rejected", decidedAt: now, guardianMessage: msg, seenAt: undefined });
      await notify(ctx, family, { audience: "adventurer", adventurerId: adv._id }, "rejected", {
        title: run.title,
        message: msg ?? "",
      }, { runId });
      return null;
    }

    const chosen: ChosenReward = run.chosenReward ?? (run.rewardType === "choice" ? "coins" : run.rewardType);
    const patch: Partial<Doc<"adventurers">> = {};
    if (chosen === "coins") patch.coins = adv.coins + run.coins;
    if (chosen === "time") {
      await grantTime(ctx, family, adv._id, run.minutes, "mission");
    }
    if (chosen === "item") {
      await ctx.db.insert("purchases", {
        familyId: family._id,
        adventurerId: adv._id,
        kind: "mission",
        title: run.itemTitle ?? run.title,
        priceCoins: 0,
        status: "pending",
        createdAt: now,
      });
    }
    const xp = applyXp(adv.level, adv.xp, run.xp);
    const today = localParts(now, family.settings.tzOffsetMin).date;
    patch.level = xp.level;
    patch.xp = xp.xp;
    patch.streak = nextStreak(adv.streak, adv.lastQuestDay, today);
    patch.lastQuestDay = today;
    await ctx.db.patch(adv._id, patch);
    await ctx.db.patch(runId, {
      status: "approved",
      chosenReward: chosen,
      decidedAt: now,
      guardianMessage: msg,
      leveledUpTo: xp.leveledUp ? xp.level : undefined,
      seenAt: undefined,
    });
    await notify(ctx, family, { audience: "adventurer", adventurerId: adv._id }, "approved", {
      title: run.title,
      ...rewardParams(run, chosen),
    }, { runId });
    return null;
  },
});
