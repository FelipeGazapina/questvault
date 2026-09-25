import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  localParts,
  rankFor,
  timeBalance,
  xpToNext,
  type Rank,
} from "./rules";

type Ctx = QueryCtx | MutationCtx;

/** Resolve the signed-in user or throw. */
export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not signed in");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

/** Any family member (guardian or paired adventurer device). */
export async function requireFamily(ctx: Ctx): Promise<{ user: Doc<"users">; family: Doc<"families"> }> {
  const user = await requireUser(ctx);
  if (!user.familyId) throw new Error("No family yet");
  const family = await ctx.db.get(user.familyId);
  if (!family) throw new Error("Family not found");
  return { user, family };
}

/** Only the guardian may manage missions, approvals, rewards and apps. */
export async function requireGuardian(ctx: Ctx): Promise<{ user: Doc<"users">; family: Doc<"families"> }> {
  const res = await requireFamily(ctx);
  if (res.user.role !== "guardian") throw new Error("Guardian only");
  return res;
}

/**
 * Act as an adventurer. A paired child device may only act as its own profile;
 * a guardian may act as any adventurer of the family (shared-device profile switching).
 */
export async function requireAdventurer(
  ctx: Ctx,
  adventurerId: Id<"adventurers">,
): Promise<{ user: Doc<"users">; family: Doc<"families">; adventurer: Doc<"adventurers">; asGuardian: boolean }> {
  const { user, family } = await requireFamily(ctx);
  const adventurer = await ctx.db.get(adventurerId);
  if (!adventurer || adventurer.familyId !== family._id || adventurer.archived) {
    throw new Error("Adventurer not found");
  }
  if (user.role === "guardian") return { user, family, adventurer, asGuardian: true };
  if (user.adventurerId !== adventurerId) throw new Error("Not your profile");
  return { user, family, adventurer, asGuardian: false };
}

export type AdventurerSummary = {
  _id: Id<"adventurers">;
  name: string;
  age: number | null;
  crest: Doc<"adventurers">["crest"];
  level: number;
  xp: number;
  xpToNext: number;
  rank: Rank;
  coins: number;
  cofreCents: number;
  streak: number;
  timeBankMin: number;
  usedTodayMin: number;
  sessionEndsAt: number | null;
  lockEnabled: boolean;
  todayTotal: number;
  todayDone: number;
  paired: boolean;
};

/** Everything the UI shows about one adventurer, computed server-side. */
export async function adventurerSummary(
  ctx: Ctx,
  family: Doc<"families">,
  adv: Doc<"adventurers">,
  now: number,
): Promise<AdventurerSummary> {
  const tz = family.settings.tzOffsetMin;
  const today = localParts(now, tz).date;

  const grants = await ctx.db
    .query("timeGrants")
    .withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id))
    .collect();
  const sessions = await ctx.db
    .query("screenSessions")
    .withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id))
    .order("desc")
    .take(50);
  const usedTodayMin = sessions
    .filter((s) => localParts(s.startedAt, tz).date === today)
    .reduce((sum, s) => sum + s.minutes, 0);
  const active = sessions.find((s) => s.startedAt <= now && s.endsAt > now);

  const runs = await ctx.db
    .query("missionRuns")
    .withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id))
    .order("desc")
    .take(100);
  const todayRuns = runs.filter((r) => r.frequency === "daily" && r.periodKey === today);

  const paired = await ctx.db
    .query("users")
    .withIndex("by_adventurer", (q) => q.eq("adventurerId", adv._id))
    .first();

  return {
    _id: adv._id,
    name: adv.name,
    age: adv.age ?? null,
    crest: adv.crest,
    level: adv.level,
    xp: adv.xp,
    xpToNext: xpToNext(adv.level),
    rank: rankFor(adv.level),
    coins: adv.coins,
    cofreCents: adv.cofreCents,
    streak: adv.lastQuestDay && adv.lastQuestDay >= prevDay(today) ? adv.streak : 0,
    timeBankMin: timeBalance(grants, now),
    usedTodayMin,
    sessionEndsAt: active ? active.endsAt : null,
    lockEnabled: adv.lockEnabled,
    todayTotal: todayRuns.length,
    todayDone: todayRuns.filter((r) => r.status === "approved").length,
    paired: paired !== null,
  };
}

function prevDay(day: string): string {
  return new Date(Date.parse(day + "T00:00:00Z") - 86_400_000).toISOString().slice(0, 10);
}
