import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const questType = v.union(v.literal("daily"), v.literal("side"), v.literal("boss"));

export const frequencyV = v.union(v.literal("once"), v.literal("daily"), v.literal("weekly"));
export const rewardTypeV = v.union(v.literal("coins"), v.literal("time"), v.literal("item"), v.literal("choice"));
export const chosenRewardV = v.union(v.literal("coins"), v.literal("time"), v.literal("item"));
export const difficultyV = v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"));
export const crestV = v.union(v.literal("teal"), v.literal("violet"), v.literal("red"));
export const appModeV = v.union(v.literal("free"), v.literal("time"), v.literal("blocked"));
export const runStatusV = v.union(
  v.literal("todo"),
  v.literal("submitted"),
  v.literal("approved"),
  v.literal("rejected"),
);

export const familySettingsV = v.object({
  tzOffsetMin: v.number(),
  maxDailyScreenMin: v.number(),
  bedtimeStart: v.string(),
  bedtimeEnd: v.string(),
  timeExpiryDays: v.number(),
  allowanceEnabled: v.boolean(),
  /** Cents credited to the adventurer's cofre per 100 coins exchanged. */
  coinRateCents: v.number(),
});

export const guardianPrefsV = v.object({
  newSubmission: v.boolean(),
  /** Hours a submission may wait before a reminder; 0 = off. */
  pendingReminderHours: v.number(),
  /** Minutes before a deadline to warn about a missing delivery; 0 = off. */
  deadlineWarnMin: v.number(),
  shopPurchase: v.boolean(),
  /** "HH:MM" or "" for off. */
  dailySummary: v.string(),
  quietStart: v.string(),
  quietEnd: v.string(),
});

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
    // Family mode
    role: v.optional(v.union(v.literal("guardian"), v.literal("adventurer"))),
    familyId: v.optional(v.id("families")),
    /** Set on a paired child device: the profile this device plays as. */
    adventurerId: v.optional(v.id("adventurers")),
    /** Wrong pairing codes typed by this (anonymous) session. */
    pairingFailures: v.optional(v.number()),
    // Legacy single-player fields (kept optional so existing rows still validate)
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
    .index("by_device", ["deviceId"])
    .index("by_family", ["familyId"])
    .index("by_adventurer", ["adventurerId"]),

  families: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    /** SHA-256 of familyId:pin — guards leaving a child profile on a shared device. */
    pinHash: v.optional(v.string()),
    settings: familySettingsV,
    guardianPrefs: guardianPrefsV,
    lastSummaryDate: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  adventurers: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    age: v.optional(v.number()),
    crest: crestV,
    level: v.number(),
    xp: v.number(),
    coins: v.number(),
    cofreCents: v.number(),
    streak: v.number(),
    lastQuestDay: v.optional(v.string()),
    lockEnabled: v.boolean(),
    archived: v.boolean(),
    createdAt: v.number(),
  }).index("by_family", ["familyId"]),

  pairingCodes: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    code: v.string(),
    expiresAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_adventurer", ["adventurerId"]),

  /** A mission template the guardian forges. Runs are spawned from it per period. */
  missions: defineTable({
    familyId: v.id("families"),
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
    xp: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_family", ["familyId"]),

  /** One mission for one adventurer in one period — the thing that gets delivered and judged. */
  missionRuns: defineTable({
    familyId: v.id("families"),
    missionId: v.id("missions"),
    adventurerId: v.id("adventurers"),
    periodKey: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    frequency: frequencyV,
    dueAt: v.number(),
    requirePhoto: v.boolean(),
    requireReport: v.boolean(),
    rewardType: rewardTypeV,
    coins: v.number(),
    minutes: v.number(),
    itemId: v.optional(v.id("shopItems")),
    itemTitle: v.optional(v.string()),
    xp: v.number(),
    status: runStatusV,
    spawnedAt: v.number(),
    // Delivery
    photoIds: v.optional(v.array(v.id("_storage"))),
    reportText: v.optional(v.string()),
    audioId: v.optional(v.id("_storage")),
    audioSeconds: v.optional(v.number()),
    chosenReward: v.optional(chosenRewardV),
    submittedAt: v.optional(v.number()),
    // Decision
    decidedAt: v.optional(v.number()),
    guardianMessage: v.optional(v.string()),
    leveledUpTo: v.optional(v.number()),
    /** Set when the adventurer has seen the approval / redo dialog. */
    seenAt: v.optional(v.number()),
    // Notification bookkeeping
    deadlineWarnedAt: v.optional(v.number()),
    guardianWarnedAt: v.optional(v.number()),
    reminderSentAt: v.optional(v.number()),
  })
    .index("by_adventurer", ["adventurerId"])
    .index("by_mission_adventurer_period", ["missionId", "adventurerId", "periodKey"])
    .index("by_family_status", ["familyId", "status"]),

  shopItems: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    priceCoins: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_family", ["familyId"]),

  timePacks: defineTable({
    familyId: v.id("families"),
    minutes: v.number(),
    priceCoins: v.number(),
    active: v.boolean(),
  }).index("by_family", ["familyId"]),

  purchases: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    kind: v.union(v.literal("item"), v.literal("time"), v.literal("mission")),
    title: v.string(),
    priceCoins: v.number(),
    minutes: v.optional(v.number()),
    /** Items need the guardian to deliver them in real life. */
    status: v.union(v.literal("pending"), v.literal("delivered")),
    createdAt: v.number(),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_family", ["familyId"])
    .index("by_adventurer", ["adventurerId"]),

  /** Screen-time credit. Balance = sum of `remaining` on unexpired grants. */
  timeGrants: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    minutes: v.number(),
    remaining: v.number(),
    expiresAt: v.number(),
    /** "penalty" rows are time debt: negative `remaining`, no expiry, paid off by new grants. */
    source: v.union(v.literal("mission"), v.literal("shop"), v.literal("gift"), v.literal("penalty")),
    createdAt: v.number(),
  }).index("by_adventurer", ["adventurerId"]),

  /** Screen time spent (unlocking "time" apps). */
  screenSessions: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    minutes: v.number(),
    startedAt: v.number(),
    endsAt: v.number(),
  }).index("by_adventurer", ["adventurerId"]),

  /** Guardian-applied penalty: coins and/or screen minutes taken, with a text or audio reason. */
  penalties: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    /** Amounts taken (≥ 0). Balances may go negative. */
    coins: v.number(),
    minutes: v.number(),
    reason: v.optional(v.string()),
    audioId: v.optional(v.id("_storage")),
    audioSeconds: v.optional(v.number()),
    createdAt: v.number(),
    /** Set when the adventurer has seen the penalty dialog. */
    seenAt: v.optional(v.number()),
  }).index("by_adventurer", ["adventurerId"]),

  /** Per-adventurer app policy. Enforcement needs the native companion (see docs/11-family-mode.md). */
  appRules: defineTable({
    familyId: v.id("families"),
    adventurerId: v.id("adventurers"),
    name: v.string(),
    mode: appModeV,
    essential: v.boolean(),
    order: v.number(),
  }).index("by_adventurer", ["adventurerId"]),

  /** Inbox for guardians (audience "guardian") and adventurers; mirrored to Web Push. */
  notifications: defineTable({
    familyId: v.id("families"),
    audience: v.union(v.literal("guardian"), v.literal("adventurer")),
    adventurerId: v.optional(v.id("adventurers")),
    /** A NoticeKind from pushMessages.ts — copy is rendered per locale from kind + params. */
    kind: v.string(),
    params: v.record(v.string(), v.union(v.string(), v.number())),
    runId: v.optional(v.id("missionRuns")),
    purchaseId: v.optional(v.id("purchases")),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_family_audience", ["familyId", "audience"])
    .index("by_adventurer", ["adventurerId"]),

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

  // ─── Legacy single-player tables (read-only; kept so existing data validates) ───
  questPool: defineTable({
    userId: v.id("users"),
    title: v.string(),
    questType: questType,
    archived: v.boolean(),
  }).index("by_user", ["userId"]),

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

  pushPeriodDispatches: defineTable({
    userId: v.id("users"),
    questType: questType,
    periodKey: v.string(),
    sentAt: v.number(),
  }).index("by_user_type_period", ["userId", "questType", "periodKey"]),
});
