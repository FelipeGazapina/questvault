// Family-mode RPG theme — mirrors the design canvas "Kit de UI" (dark leather, brass, parchment).
// Brass is the only action colour; each reward has its own colour and always ships with an icon.

export const T = {
  bg: "#13100d",
  deep: "#0e0b09",
  well: "#15110e",
  surface: "#1f1914",
  card: "#261f19",
  cardHi: "#2c2319",
  line: "#5a4630",
  lineSoft: "#3a2e22",
  brass: "#c9a45c",
  brassHi: "#e2c587",
  brassLight: "#ecd49c",
  brassDk: "#8a6d3b",
  onBrass: "#1a140f",
  text: "#ece2cf",
  soft: "#d8ccb6",
  muted: "#a8987e",
  faint: "#93846c",
  parch: "#e8dcc2",
  parchLine: "#c7b28b",
  ink: "#2a2118",
  inkMuted: "#6a5a44",
  coin: "#e3b341",
  coinLine: "#6b5420",
  time: "#6fc6bb",
  timeFill: "#5fb8ad",
  timeLine: "#2f5f59",
  xp: "#9dbde8",
  xpFill: "#8fb4e3",
  xpLine: "#35507a",
  pend: "#c2b0ee",
  pendLine: "#5a4b85",
  ok: "#a3d38e",
  okFill: "#7fb069",
  okLine: "#466b3a",
  bad: "#ec9a8f",
  badFill: "#c65b4f",
  badLine: "#7d362e",
  badge: "#b5483f",
  streak: "#f0a35a",
} as const;

export const F = {
  display: "Cinzel_700Bold",
  displaySemi: "Cinzel_600SemiBold",
  body: "AlegreyaSans_400Regular",
  bodyItalic: "AlegreyaSans_400Regular_Italic",
  medium: "AlegreyaSans_500Medium",
  bold: "AlegreyaSans_700Bold",
  heavy: "AlegreyaSans_800ExtraBold",
} as const;

export type Crest = "teal" | "violet" | "red";

export const CREST_COLORS: Record<Crest, string> = {
  teal: "#1f3b38",
  violet: "#35294d",
  red: "#4a1f1c",
};

/** Money on screen — always a clean sans, never a decorative face. */
export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "45 min" / "1 h 40 min". */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function hhmm(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
