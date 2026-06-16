import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const questType = v.union(v.literal("daily"), v.literal("side"), v.literal("boss"));

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),
    tier: v.optional(v.union(v.literal("xp"), v.literal("stickers"), v.literal("loot"))),
    xp: v.optional(v.number()),
    level: v.optional(v.number()),
    streak: v.optional(v.number()),
    lastQuestDay: v.optional(v.string()),
    lockedGold: v.optional(v.number()),
    spendableGold: v.optional(v.number()),
    convertedToday: v.optional(v.number()),
    convertedDay: v.optional(v.string()),
    waitlist: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("by_device", ["deviceId"]),

  /** User-authored task library — titles are reused when summoning instances. */
  questPool: defineTable({
    userId: v.id("users"),
    title: v.string(),
    questType: questType,
    archived: v.boolean(),
  }).index("by_user", ["userId"]),

  /** One spawned challenge for one period — never reset, only completed or incomplete. */
  questInstances: defineTable({
    userId: v.id("users"),
    poolId: v.id("questPool"),
    title: v.string(),
    questType: questType,
    periodKey: v.string(),
    xp: v.number(),
    conversionCents: v.number(),
    status: v.union(v.literal("open"), v.literal("completed"), v.literal("incomplete")),
    spawnedAt: v.number(),
    completedAt: v.optional(v.number()),
    completedDay: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_type_period", ["userId", "questType", "periodKey"]),

  wishlist: defineTable({
    userId: v.id("users"),
    title: v.string(),
    url: v.optional(v.string()),
    priceCents: v.number(),
    iconId: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    redeemedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  ledger: defineTable({
    userId: v.id("users"),
    entryType: v.union(
      v.literal("deposit"),
      v.literal("convert"),
      v.literal("redeem"),
      v.literal("withdraw"),
    ),
    amountCents: v.number(),
    description: v.string(),
  }).index("by_user", ["userId"]),

  /** Web Push subscription (PWA) — one row per browser endpoint. */
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    locale: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  /** Dedup: one push per user / quest type / period. */
  pushPeriodDispatches: defineTable({
    userId: v.id("users"),
    questType: questType,
    periodKey: v.string(),
    sentAt: v.number(),
  }).index("by_user_type_period", ["userId", "questType", "periodKey"]),
});
