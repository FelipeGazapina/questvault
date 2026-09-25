import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdventurer, requireGuardian } from "./access";
import { appModeV } from "./schema";

/** App policy for one adventurer. Visible to the adventurer too (lock screen lists what stays open). */
export const listApps = query({
  args: { adventurerId: v.id("adventurers") },
  handler: async (ctx, { adventurerId }) => {
    await requireAdventurer(ctx, adventurerId);
    const rows = await ctx.db.query("appRules").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).collect();
    return rows.sort((a, b) => a.order - b.order);
  },
});

export const setAppMode = mutation({
  args: { ruleId: v.id("appRules"), mode: appModeV },
  returns: v.null(),
  handler: async (ctx, { ruleId, mode }) => {
    const { family } = await requireGuardian(ctx);
    const rule = await ctx.db.get(ruleId);
    if (!rule || rule.familyId !== family._id) throw new Error("App not found");
    if (rule.essential && mode !== "free") throw new Error("Essential apps stay open");
    await ctx.db.patch(ruleId, { mode });
    return null;
  },
});

export const addApp = mutation({
  args: { adventurerId: v.id("adventurers"), name: v.string(), mode: appModeV },
  returns: v.id("appRules"),
  handler: async (ctx, { adventurerId, name, mode }) => {
    const { family } = await requireGuardian(ctx);
    await requireAdventurer(ctx, adventurerId);
    const clean = name.trim().slice(0, 40);
    if (!clean) throw new Error("Name required");
    const rows = await ctx.db.query("appRules").withIndex("by_adventurer", (q) => q.eq("adventurerId", adventurerId)).collect();
    if (rows.some((r) => r.name.toLowerCase() === clean.toLowerCase())) throw new Error("App already listed");
    return await ctx.db.insert("appRules", {
      familyId: family._id,
      adventurerId,
      name: clean,
      mode,
      essential: false,
      order: rows.length,
    });
  },
});

export const removeApp = mutation({
  args: { ruleId: v.id("appRules") },
  returns: v.null(),
  handler: async (ctx, { ruleId }) => {
    const { family } = await requireGuardian(ctx);
    const rule = await ctx.db.get(ruleId);
    if (!rule || rule.familyId !== family._id) return null;
    if (rule.essential) throw new Error("Essential apps stay listed");
    await ctx.db.delete(ruleId);
    return null;
  },
});
