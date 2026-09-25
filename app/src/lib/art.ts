// Pixel-art props and scenes, pre-scaled with nearest-neighbour so they stay crisp on any screen.
// Sources: design/ (generators) — props are 12× their pixel grid, scenes 9×.

export const SPRITES = {
  anvil: { src: require("@/assets/rpg/sprites/anvil.png"), w: 24, h: 14 },
  bannerRed: { src: require("@/assets/rpg/sprites/banner-red.png"), w: 16, h: 25 },
  bannerTeal: { src: require("@/assets/rpg/sprites/banner-teal.png"), w: 16, h: 25 },
  bannerViolet: { src: require("@/assets/rpg/sprites/banner-violet.png"), w: 16, h: 25 },
  bell: { src: require("@/assets/rpg/sprites/bell.png"), w: 18, h: 15 },
  board: { src: require("@/assets/rpg/sprites/board.png"), w: 26, h: 21 },
  chest: { src: require("@/assets/rpg/sprites/chest.png"), w: 24, h: 16 },
  chestOpen: { src: require("@/assets/rpg/sprites/chestopen.png"), w: 24, h: 17 },
  coin: { src: require("@/assets/rpg/sprites/coin.png"), w: 16, h: 14 },
  gate: { src: require("@/assets/rpg/sprites/gate.png"), w: 24, h: 22 },
  helm: { src: require("@/assets/rpg/sprites/helm.png"), w: 18, h: 17 },
  hourglass: { src: require("@/assets/rpg/sprites/hourglass.png"), w: 18, h: 18 },
  padlock: { src: require("@/assets/rpg/sprites/padlock.png"), w: 16, h: 13 },
  scroll: { src: require("@/assets/rpg/sprites/scroll.png"), w: 22, h: 17 },
  stall: { src: require("@/assets/rpg/sprites/stall.png"), w: 26, h: 19 },
  torch: { src: require("@/assets/rpg/sprites/torch.png"), w: 10, h: 20 },
} as const;

export type SpriteName = keyof typeof SPRITES;

/** Scenes: 130×80 grid (portão: 130×190). The bottom quarter is dark ground that dissolves into T.bg. */
export const SCENES = {
  castelo: { src: require("@/assets/rpg/scenes/castelo.png"), w: 130, h: 80 },
  ruinas: { src: require("@/assets/rpg/scenes/ruinas.png"), w: 130, h: 80 },
  taverna: { src: require("@/assets/rpg/scenes/taverna.png"), w: 130, h: 80 },
  biblioteca: { src: require("@/assets/rpg/scenes/biblioteca.png"), w: 130, h: 80 },
  portaoFaixa: { src: require("@/assets/rpg/scenes/portao-faixa.png"), w: 130, h: 80 },
  portao: { src: require("@/assets/rpg/scenes/portao.png"), w: 130, h: 190 },
} as const;

export type SceneName = keyof typeof SCENES;

export const CREST_SPRITE = {
  teal: "bannerTeal",
  violet: "bannerViolet",
  red: "bannerRed",
} as const satisfies Record<string, SpriteName>;
