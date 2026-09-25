import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import {
  adventurerSummary,
  requireAdventurer,
  requireGuardian,
  requireUser,
} from "./access";
import { crestV } from "./schema";
import { DEFAULT_TZ_OFFSET_MIN } from "./rules";

const PAIRING_TTL_MS = 30 * 60_000;
/** Wrong codes allowed per anonymous session before it must start over. */
const MAX_PAIRING_FAILURES = 5;

const DEFAULT_SETTINGS: Doc<"families">["settings"] = {
  tzOffsetMin: DEFAULT_TZ_OFFSET_MIN,
  maxDailyScreenMin: 120,
  bedtimeStart: "21:30",
  bedtimeEnd: "07:00",
  timeExpiryDays: 7,
  allowanceEnabled: true,
  coinRateCents: 500,
};

const DEFAULT_PREFS: Doc<"families">["guardianPrefs"] = {
  newSubmission: true,
  pendingReminderHours: 2,
  deadlineWarnMin: 30,
  shopPurchase: true,
  dailySummary: "21:00",
  quietStart: "22:00",
  quietEnd: "07:00",
};

/** Apps every new adventurer starts with. Essentials can't be blocked. */
const DEFAULT_APPS: { name: string; mode: "free" | "time" | "blocked"; essential: boolean }[] = [
  { name: "Telefone", mode: "free", essential: true },
  { name: "Mensagens", mode: "free", essential: true },
  { name: "YouTube", mode: "time", essential: false },
  { name: "Navegador", mode: "blocked", essential: false },
];

async function pinHash(familyId: Id<"families">, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${familyId}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Who am I, which family, and every adventurer's live summary. Drives routing on the client. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const family = user.familyId ? await ctx.db.get(user.familyId) : null;
    if (!family) {
      return { user: { _id: user._id, name: user.name ?? "", role: user.role ?? null, isAnonymous: !!user.isAnonymous }, family: null, adventurers: [], deviceAdventurerId: null };
    }
    const now = Date.now();
    const advs = (await ctx.db.query("adventurers").withIndex("by_family", (q) => q.eq("familyId", family._id)).collect())
      .filter((a) => !a.archived)
      .sort((a, b) => a.createdAt - b.createdAt);
    const visible = user.role === "guardian" ? advs : advs.filter((a) => a._id === user.adventurerId);
    const adventurers = await Promise.all(visible.map((a) => adventurerSummary(ctx, family, a, now)));
    const owner = await ctx.db.get(family.ownerId);
    return {
      user: { _id: user._id, name: user.name ?? "", role: user.role ?? null, isAnonymous: !!user.isAnonymous },
      family: {
        _id: family._id,
        name: family.name,
        /** Signs the guardian's messages on the child's side ("Felipe, o Guardião"). */
        guardianName: owner?.name ?? "",
        hasPin: !!family.pinHash,
        settings: family.settings,
        guardianPrefs: user.role === "guardian" ? family.guardianPrefs : null,
      },
      adventurers,
      deviceAdventurerId: user.adventurerId ?? null,
    };
  },
});

/** First run for a guardian: create the family and seed the market. */
export const createFamily = mutation({
  args: { guardianName: v.string(), familyName: v.optional(v.string()) },
  returns: v.id("families"),
  handler: async (ctx, { guardianName, familyName }) => {
    const user = await requireUser(ctx);
    if (user.familyId) throw new Error("Already in a family");
    if (user.isAnonymous) throw new Error("Guardians need an account");
    const name = guardianName.trim().slice(0, 24) || "Guardião";
    const now = Date.now();
    const familyId = await ctx.db.insert("families", {
      name: (familyName ?? "").trim().slice(0, 40) || `Família de ${name}`,
      ownerId: user._id,
      settings: DEFAULT_SETTINGS,
      guardianPrefs: DEFAULT_PREFS,
      createdAt: now,
    });
    await ctx.db.patch(user._id, { role: "guardian", familyId, name });
    for (const [minutes, priceCoins] of [[15, 30], [30, 55], [60, 100]] as const) {
      await ctx.db.insert("timePacks", { familyId, minutes, priceCoins, active: true });
    }
    for (const [title, priceCoins] of [["Escolher o filme da noite", 80], ["Sobremesa especial", 150]] as const) {
      await ctx.db.insert("shopItems", { familyId, title, priceCoins, active: true, createdAt: now });
    }
    return familyId;
  },
});

async function seedApps(ctx: MutationCtx, familyId: Id<"families">, adventurerId: Id<"adventurers">) {
  let order = 0;
  for (const app of DEFAULT_APPS) {
    await ctx.db.insert("appRules", { familyId, adventurerId, ...app, order: order++ });
  }
}

export const addAdventurer = mutation({
  args: { name: v.string(), age: v.optional(v.number()), crest: crestV },
  returns: v.id("adventurers"),
  handler: async (ctx, { name, age, crest }) => {
    const { family } = await requireGuardian(ctx);
    const clean = name.trim().slice(0, 20);
    if (!clean) throw new Error("Name required");
    const id = await ctx.db.insert("adventurers", {
      familyId: family._id,
      name: clean,
      age: age && age > 0 && age < 30 ? Math.round(age) : undefined,
      crest,
      level: 1,
      xp: 0,
      coins: 0,
      cofreCents: 0,
      streak: 0,
      lockEnabled: true,
      archived: false,
      createdAt: Date.now(),
    });
    await seedApps(ctx, family._id, id);
    return id;
  },
});

export const updateAdventurer = mutation({
  args: {
    adventurerId: v.id("adventurers"),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    crest: v.optional(crestV),
    lockEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { adventurerId, name, age, crest, lockEnabled }) => {
    await requireGuardian(ctx);
    const { adventurer } = await requireAdventurer(ctx, adventurerId);
    const patch: Partial<Doc<"adventurers">> = {};
    if (name !== undefined && name.trim()) patch.name = name.trim().slice(0, 20);
    if (age !== undefined) patch.age = age > 0 && age < 30 ? Math.round(age) : undefined;
    if (crest !== undefined) patch.crest = crest;
    if (lockEnabled !== undefined) patch.lockEnabled = lockEnabled;
    await ctx.db.patch(adventurer._id, patch);
    return null;
  },
});

export const archiveAdventurer = mutation({
  args: { adventurerId: v.id("adventurers") },
  returns: v.null(),
  handler: async (ctx, { adventurerId }) => {
    await requireGuardian(ctx);
    await requireAdventurer(ctx, adventurerId);
    await ctx.db.patch(adventurerId, { archived: true });
    return null;
  },
});

/** PIN that guards leaving a child profile on the guardian's own phone. Empty string clears it. */
export const setPin = mutation({
  args: { pin: v.string() },
  returns: v.null(),
  handler: async (ctx, { pin }) => {
    const { family } = await requireGuardian(ctx);
    if (pin === "") {
      await ctx.db.patch(family._id, { pinHash: undefined });
      return null;
    }
    if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN must be 4 to 6 digits");
    await ctx.db.patch(family._id, { pinHash: await pinHash(family._id, pin) });
    return null;
  },
});

export const verifyPin = mutation({
  args: { pin: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { pin }) => {
    const { family } = await requireGuardian(ctx);
    if (!family.pinHash) return true;
    return (await pinHash(family._id, pin)) === family.pinHash;
  },
});

/** Six-digit code the child types on their own phone to bind it to their profile. */
export const createPairingCode = mutation({
  args: { adventurerId: v.id("adventurers") },
  returns: v.object({ code: v.string(), expiresAt: v.number() }),
  handler: async (ctx, { adventurerId }) => {
    const { family } = await requireGuardian(ctx);
    await requireAdventurer(ctx, adventurerId);
    const old = await ctx.db.query("pairingCodes").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).collect();
    for (const row of old) await ctx.db.delete(row._id);
    let code = "";
    for (let tries = 0; tries < 10; tries += 1) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      const clash = await ctx.db.query("pairingCodes").withIndex("by_code", (q) => q.eq("code", code)).first();
      if (!clash) break;
    }
    const expiresAt = Date.now() + PAIRING_TTL_MS;
    await ctx.db.insert("pairingCodes", { familyId: family._id, adventurerId, code, expiresAt });
    return { code, expiresAt };
  },
});

/** Called on the child's phone right after an anonymous sign-in. */
export const claimPairingCode = mutation({
  args: { code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { code }) => {
    const user = await requireUser(ctx);
    if (user.role === "guardian") throw new Error("This phone belongs to a guardian");
    const failures = user.pairingFailures ?? 0;
    if (failures >= MAX_PAIRING_FAILURES) throw new Error("TOO_MANY_ATTEMPTS");
    const row = await ctx.db.query("pairingCodes").withIndex("by_code", (q) => q.eq("code", code.trim())).first();
    if (!row || row.expiresAt < Date.now()) {
      await ctx.db.patch(user._id, { pairingFailures: failures + 1 });
      return false;
    }
    const adventurer = await ctx.db.get(row.adventurerId);
    if (!adventurer || adventurer.archived) return false;
    await ctx.db.patch(user._id, {
      role: "adventurer",
      familyId: row.familyId,
      adventurerId: row.adventurerId,
      name: adventurer.name,
    });
    await ctx.db.delete(row._id);
    return true;
  },
});

export const updateSettings = mutation({
  args: {
    maxDailyScreenMin: v.optional(v.number()),
    bedtimeStart: v.optional(v.string()),
    bedtimeEnd: v.optional(v.string()),
    timeExpiryDays: v.optional(v.number()),
    allowanceEnabled: v.optional(v.boolean()),
    coinRateCents: v.optional(v.number()),
    tzOffsetMin: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { family } = await requireGuardian(ctx);
    const next = { ...family.settings };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) (next as Record<string, unknown>)[key] = value;
    }
    next.maxDailyScreenMin = clamp(next.maxDailyScreenMin, 0, 24 * 60);
    next.timeExpiryDays = clamp(next.timeExpiryDays, 1, 365);
    next.coinRateCents = clamp(next.coinRateCents, 0, 100_000);
    await ctx.db.patch(family._id, { settings: next });
    return null;
  },
});

export const updateGuardianPrefs = mutation({
  args: {
    newSubmission: v.optional(v.boolean()),
    pendingReminderHours: v.optional(v.number()),
    deadlineWarnMin: v.optional(v.number()),
    shopPurchase: v.optional(v.boolean()),
    dailySummary: v.optional(v.string()),
    quietStart: v.optional(v.string()),
    quietEnd: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { family } = await requireGuardian(ctx);
    const next = { ...family.guardianPrefs };
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) (next as Record<string, unknown>)[key] = value;
    }
    await ctx.db.patch(family._id, { guardianPrefs: next });
    return null;
  },
});

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}
