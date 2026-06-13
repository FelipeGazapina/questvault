// Sweetie 16 — see docs/08-design-direction.md. Gold is reserved for money (D1).
export const C = {
  night: "#1a1c2c",
  deep: "#5d275d",
  blood: "#b13e53",
  ember: "#ef7d57",
  gold: "#ffcd75",
  mint: "#a7f070",
  leaf: "#38b764",
  tealdark: "#257179",
  navy: "#29366f",
  blue: "#3b5dc9",
  sky: "#41a6f6",
  ice: "#73eff7",
  white: "#f4f4f4",
  fog: "#94b0c2",
  slate: "#566c86",
  ink: "#333c57",
  panelDark: "#14162a",
} as const;

export const FONT = {
  head: "PressStart2P_400Regular",
  body: "VT323_400Regular",
  // D2.1: monetary amounts use the platform's clean sans, never pixel fonts.
} as const;

export function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
