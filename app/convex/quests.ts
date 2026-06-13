import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  DAILY_CONVERSION_CAP_CENTS,
  LEVEL_BONUS_MAX_CENTS,
  LEVEL_BONUS_MIN_CENTS,
  LEVEL_BONUS_RATE,
  periodKeyFor,
  QUEST_CONVERSION_CAP_CENTS,
  type QuestType,
  todayStr,
  xpToNext,
  yesterdayStr,
} from "./game";
import { syncSpawnedQuests, forceResummonAll } from "./questSpawn";
import { requireUser } from "./users";

const questTypeValidator = v.union(v.literal("daily"), v.literal("side"), v.literal("boss"));

const BOARD_TYPES: QuestType[] = ["daily", "side", "boss"];

/** Summon this period's quests from the pool (idempotent). Call on board load. */
export const syncBoard = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await syncSpawnedQuests(ctx, user._id);
  },
});

/** Test only — delete this period's instances and spawn a fresh random hand. */
export const debugResummon = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await forceResummonAll(ctx, user._id);
    return null;
  },
});

/** Open spawned instances for the current day / week / month, grouped by type. */
export const board = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const all = await ctx.db
      .query("questInstances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const grouped: Record<QuestType, typeof all> = { daily: [], side: [], boss: [] };

    for (const type of BOARD_TYPES) {
      const periodKey = periodKeyFor(type);
      grouped[type] = all
        .filter((i) => i.questType === type && i.periodKey === periodKey && i.status === "open")
        .sort((a, b) => a.spawnedAt - b.spawnedAt);
    }

    const pool = await ctx.db
      .query("questPool")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const poolCounts = { daily: 0, side: 0, boss: 0 };
    for (const p of pool) {
      if (!p.archived) poolCounts[p.questType] += 1;
    }

    return { ...grouped, poolCounts };
  },
});

export const poolList = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return (
      await ctx.db
        .query("questPool")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect()
    ).filter((p) => !p.archived);
  },
});

export const addToPool = mutation({
  args: {
    title: v.string(),
    questType: questTypeValidator,
  },
  handler: async (ctx, { title, questType }) => {
    const user = await requireUser(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Quest needs a title");
    await ctx.db.insert("questPool", {
      userId: user._id,
      title: trimmed.slice(0, 60),
      questType,
      archived: false,
    });
    await syncSpawnedQuests(ctx, user._id);
  },
});

export const removeFromPool = mutation({
  args: { poolId: v.id("questPool") },
  handler: async (ctx, { poolId }) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(poolId);
    if (!entry || entry.userId !== user._id) throw new Error("Pool entry not found");
    await ctx.db.patch(poolId, { archived: true });
  },
});

export const complete = mutation({
  args: { instanceId: v.id("questInstances") },
  handler: async (ctx, { instanceId }) => {
    const user = await requireUser(ctx);
    const instance = await ctx.db.get(instanceId);
    if (!instance || instance.userId !== user._id) throw new Error("Quest not found");
    if (instance.status !== "open") throw new Error("Already finished");

    const period = periodKeyFor(instance.questType);
    if (instance.periodKey !== period) throw new Error("This quest expired");

    const day = todayStr();

    const streak =
      user.lastQuestDay === day
        ? (user.streak ?? 0)
        : user.lastQuestDay === yesterdayStr(day)
          ? (user.streak ?? 0) + 1
          : 1;

    let xp = (user.xp ?? 0) + instance.xp;
    let level = user.level ?? 1;
    let levelUps = 0;
    while (xp >= xpToNext(level)) {
      xp -= xpToNext(level);
      level += 1;
      levelUps += 1;
    }

    let locked = user.lockedGold ?? 0;
    const convertedToday = user.convertedDay === day ? (user.convertedToday ?? 0) : 0;
    const questCap = QUEST_CONVERSION_CAP_CENTS[instance.questType];
    const capRemaining = Math.max(0, DAILY_CONVERSION_CAP_CENTS - convertedToday);
    const questConv = Math.min(instance.conversionCents, questCap, locked, capRemaining);
    locked -= questConv;

    let bonusConv = 0;
    for (let i = 0; i < levelUps; i += 1) {
      const bonus = Math.min(
        locked,
        Math.max(LEVEL_BONUS_MIN_CENTS, Math.min(LEVEL_BONUS_MAX_CENTS, Math.round(locked * LEVEL_BONUS_RATE))),
      );
      bonusConv += bonus;
      locked -= bonus;
    }

    const now = Date.now();

    await ctx.db.patch(user._id, {
      xp,
      level,
      streak,
      lastQuestDay: day,
      lockedGold: locked,
      spendableGold: (user.spendableGold ?? 0) + questConv + bonusConv,
      convertedToday: convertedToday + questConv,
      convertedDay: day,
    });

    await ctx.db.patch(instanceId, {
      status: "completed",
      completedAt: now,
      completedDay: day,
    });

    if (questConv > 0) {
      await ctx.db.insert("ledger", {
        userId: user._id,
        entryType: "convert",
        amountCents: questConv,
        description: `Quest: ${instance.title}`,
      });
    }
    if (bonusConv > 0) {
      await ctx.db.insert("ledger", {
        userId: user._id,
        entryType: "convert",
        amountCents: bonusConv,
        description: `Level ${level} bonus`,
      });
    }

    return {
      xpGained: instance.xp,
      leveledUpTo: levelUps > 0 ? level : null,
      convertedCents: questConv + bonusConv,
      streak,
    };
  },
});

export const recentCompletions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const all = await ctx.db
      .query("questInstances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return all
      .filter((i) => i.status === "completed")
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 30);
  },
});

export const dashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const all = await ctx.db
      .query("questInstances")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completed = all.filter((i) => i.status === "completed" && i.completedDay);

    const today = new Date(todayStr() + "T00:00:00Z");
    const dayMs = 86400000;
    const dayAt = (offset: number) => new Date(today.getTime() + offset * dayMs).toISOString().slice(0, 10);

    const weekday = today.getUTCDay() || 7;
    const weekStart = dayAt(-(weekday - 1));
    const lastWeekStart = dayAt(-(weekday - 1) - 7);
    const monthPrefix = todayStr().slice(0, 7);

    let thisWeek = 0;
    let lastWeek = 0;
    let bossesTotal = 0;
    let bossesThisMonth = 0;
    const byDay = new Map<string, number>();

    for (const c of completed) {
      const day = c.completedDay!;
      if (day >= weekStart) thisWeek += 1;
      else if (day >= lastWeekStart) lastWeek += 1;
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      if (c.questType === "boss") {
        bossesTotal += 1;
        if (day.startsWith(monthPrefix)) bossesThisMonth += 1;
      }
    }

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const day = dayAt(i - 6);
      return { day, count: byDay.get(day) ?? 0 };
    });

    const recent = completed
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 12)
      .map((c) => ({
        id: c._id,
        title: c.title,
        questType: c.questType,
        xp: c.xp,
        day: c.completedDay!,
      }));

    return {
      total: completed.length,
      thisWeek,
      lastWeek,
      bossesTotal,
      bossesThisMonth,
      streak: user.streak ?? 0,
      questedToday: user.lastQuestDay === todayStr(),
      last7,
      recent,
    };
  },
});
