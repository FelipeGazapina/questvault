import type { ImageSourcePropType } from "react-native";

/** Pixel loot icons — source art in design/b4-loot-icons.js (Pencil). */
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

export function isLootIconId(value: string): value is LootIconId {
  return (LOOT_ICON_IDS as readonly string[]).includes(value);
}

const SOURCES: Record<LootIconId, ImageSourcePropType> = {
  headset: require("@/assets/sprites/loot/headset.png"),
  pizza: require("@/assets/sprites/loot/pizza.png"),
  gamepad: require("@/assets/sprites/loot/gamepad.png"),
  sneaker: require("@/assets/sprites/loot/sneaker.png"),
  book: require("@/assets/sprites/loot/book.png"),
  phone: require("@/assets/sprites/loot/phone.png"),
  coffee: require("@/assets/sprites/loot/coffee.png"),
  gift: require("@/assets/sprites/loot/gift.png"),
};

/** i18n keys under shop.icon* */
export const LOOT_ICONS: { id: LootIconId; labelKey: string }[] = [
  { id: "headset", labelKey: "shop.iconHeadset" },
  { id: "pizza", labelKey: "shop.iconPizza" },
  { id: "gamepad", labelKey: "shop.iconGamepad" },
  { id: "sneaker", labelKey: "shop.iconSneaker" },
  { id: "book", labelKey: "shop.iconBook" },
  { id: "phone", labelKey: "shop.iconPhone" },
  { id: "coffee", labelKey: "shop.iconCoffee" },
  { id: "gift", labelKey: "shop.iconGift" },
];

export function lootIconSource(id: LootIconId): ImageSourcePropType {
  return SOURCES[id];
}

export function resolveLootIconId(iconId: string | undefined): LootIconId {
  return iconId && isLootIconId(iconId) ? iconId : DEFAULT_LOOT_ICON;
}

export const DEFAULT_LOOT_ICON: LootIconId = "gift";
