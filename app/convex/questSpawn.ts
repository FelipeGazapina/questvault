import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import {
  CONVERSION_DEFAULTS,
  periodKeyFor,
  pickRandom,
  rollXp,
  SPAWN_SLOTS,
  type QuestType,
} from "./game";

const QUEST_TYPES: QuestType[] = ["daily", "side", "boss"];

async function expireStaleOpens(
  ctx: MutationCtx,
  userId: Id<"users">,
  questType: QuestType,
  periodKey: string,
) {
  const openStale = await ctx.db
    .query("questInstances")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();

  for (const inst of openStale) {
    if (inst.questType === questType && inst.status === "open" && inst.periodKey !== periodKey) {
      await ctx.db.patch(inst._id, { status: "incomplete" });
    }
  }
}

/** Summon instances for one type and period. Skips if already dealt unless `force`. Returns count spawned. */
export async function spawnForType(
  ctx: MutationCtx,
  userId: Id<"users">,
  questType: QuestType,
  options?: { force?: boolean },
): Promise<number> {
  const periodKey = periodKeyFor(questType);

  const periodInstances = await ctx.db
    .query("questInstances")
    .withIndex("by_user_type_period", (q) =>
      q.eq("userId", userId).eq("questType", questType).eq("periodKey", periodKey),
    )
    .collect();

  if (!options?.force && periodInstances.length > 0) return 0;

  if (options?.force) {
    for (const inst of periodInstances) {
      await ctx.db.delete(inst._id);
    }
  }

  await expireStaleOpens(ctx, userId, questType, periodKey);

  const pool = (
    await ctx.db
      .query("questPool")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  ).filter((p) => !p.archived && p.questType === questType);

  const toSpawn = pickRandom(pool, SPAWN_SLOTS[questType]);
  const now = Date.now();

  for (const entry of toSpawn) {
    await ctx.db.insert("questInstances", {
      userId,
      poolId: entry._id,
      title: entry.title,
      questType,
      periodKey,
      xp: rollXp(questType),
      conversionCents: CONVERSION_DEFAULTS[questType],
      status: "open",
      spawnedAt: now,
    });
  }

  return toSpawn.length;
}

/** Mark stale open instances incomplete, then summon this period's hand if not yet dealt. */
export async function syncSpawnedQuests(ctx: MutationCtx, userId: Id<"users">) {
  for (const questType of QUEST_TYPES) {
    await spawnForType(ctx, userId, questType);
  }
}

/** Test helper — wipe this period's instances and deal a fresh random hand. */
export async function forceResummonAll(ctx: MutationCtx, userId: Id<"users">) {
  for (const questType of QUEST_TYPES) {
    await spawnForType(ctx, userId, questType, { force: true });
  }
}
