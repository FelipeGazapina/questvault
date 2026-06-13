import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { lootIconIdValidator } from "./lootIcons";
import { requireUser } from "./users";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const items = await ctx.db
      .query("wishlist")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: item.imageId ? await ctx.storage.getUrl(item.imageId) : null,
      })),
    );
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    priceCents: v.number(),
    url: v.optional(v.string()),
    iconId: lootIconIdValidator,
  },
  returns: v.null(),
  handler: async (ctx, { title, priceCents, url, iconId }) => {
    const user = await requireUser(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Item needs a title");
    if (!Number.isInteger(priceCents) || priceCents <= 0) throw new Error("Invalid price");
    await ctx.db.insert("wishlist", {
      userId: user._id,
      title: trimmed.slice(0, 60),
      priceCents,
      url: url?.trim() || undefined,
      iconId,
    });
    return null;
  },
});

export const remove = mutation({
  args: { itemId: v.id("wishlist") },
  handler: async (ctx, { itemId }) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== user._id) throw new Error("Item not found");
    await ctx.db.delete(itemId);
  },
});

// R4: redemption only ever happens from an explicit user confirmation in the UI.
export const redeem = mutation({
  args: { itemId: v.id("wishlist") },
  handler: async (ctx, { itemId }) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== user._id) throw new Error("Item not found");
    if (item.redeemedAt) throw new Error("Already claimed");
    const spendable = user.spendableGold ?? 0;
    if (spendable < item.priceCents) throw new Error("Not enough gold in the pouch");

    await ctx.db.patch(user._id, { spendableGold: spendable - item.priceCents });
    await ctx.db.patch(itemId, { redeemedAt: Date.now() });
    await ctx.db.insert("ledger", {
      userId: user._id,
      entryType: "redeem",
      amountCents: item.priceCents,
      description: `Loot claimed: ${item.title}`,
    });
  },
});

// Convex file storage: wishlist item images (upload URL flow).
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setImage = mutation({
  args: { itemId: v.id("wishlist"), storageId: v.id("_storage") },
  handler: async (ctx, { itemId, storageId }) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(itemId);
    if (!item || item.userId !== user._id) throw new Error("Item not found");
    await ctx.db.patch(itemId, { imageId: storageId });
  },
});
