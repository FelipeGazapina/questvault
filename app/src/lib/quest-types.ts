import type { QuestType } from "../../convex/game";

export const QUEST_TYPES: QuestType[] = ["daily", "side", "boss"];

export const BOARD_SECTIONS: { type: QuestType; colorKey: "sky" | "mint" | "gold" }[] = [
  { type: "daily", colorKey: "sky" },
  { type: "side", colorKey: "mint" },
  { type: "boss", colorKey: "gold" },
];

export function typeLabelKey(type: QuestType) {
  return `board.type${type.charAt(0).toUpperCase() + type.slice(1)}` as
    | "board.typeDaily"
    | "board.typeSide"
    | "board.typeBoss";
}

export function sectionColor(type: QuestType, C: { sky: string; mint: string; gold: string }) {
  if (type === "daily") return C.sky;
  if (type === "side") return C.mint;
  return C.gold;
}
