import { v } from "convex/values";

/** Must match app/src/lib/loot-icons.ts LOOT_ICON_IDS */
export const LOOT_ICON_IDS = [
  "headset",
  "pizza",
  "gamepad",
  "sneaker",
  "book",
  "phone",
  "coffee",
  "gift",
] as const;

export type LootIconId = (typeof LOOT_ICON_IDS)[number];

export const lootIconIdValidator = v.union(
  v.literal("headset"),
  v.literal("pizza"),
  v.literal("gamepad"),
  v.literal("sneaker"),
  v.literal("book"),
  v.literal("phone"),
  v.literal("coffee"),
  v.literal("gift"),
);

export function assertLootIconId(id: string): LootIconId {
  if (!(LOOT_ICON_IDS as readonly string[]).includes(id)) {
    throw new Error("Invalid loot icon");
  }
  return id as LootIconId;
}
