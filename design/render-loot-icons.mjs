/**
 * Renders loot icon PNGs from the same pixel grid as design/b4-loot-icons.js.
 * Run: node design/render-loot-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "app", "assets", "sprites", "loot");

const PALETTE = {
  ink: [0x33, 0x3c, 0x57, 0xff],
  tealdark: [0x1e, 0x6f, 0x5c, 0xff],
  fog: [0x94, 0xb0, 0xc2, 0xff],
  ember: [0xef, 0x7d, 0x57, 0xff],
  gold: [0xff, 0xcd, 0x75, 0xff],
  leaf: [0x38, 0xb7, 0x64, 0xff],
  blood: [0xb1, 0x3e, 0x53, 0xff],
  white: [0xf4, 0xf4, 0xf4, 0xff],
  sky: [0x41, 0xa6, 0xf6, 0xff],
  mint: [0xa7, 0xf0, 0x70, 0xff],
  night: [0x1a, 0x1c, 0x2c, 0x00],
};

/** @type {Record<string, [string, [number, number, number, number][]][]>} */
const ICONS = {
  headset: [
    ["ink", [[1, 4, 2, 5], [13, 4, 2, 5], [3, 3, 10, 1], [2, 9, 12, 1], [3, 10, 3, 2], [10, 10, 3, 2]]],
    ["tealdark", [[3, 4, 10, 5]]],
    ["fog", [[5, 5, 6, 3]]],
    ["ember", [[4, 10, 2, 2], [10, 10, 2, 2]]],
  ],
  pizza: [
    ["ink", [[2, 2, 12, 1], [1, 3, 1, 10], [13, 3, 1, 10], [2, 13, 12, 1]]],
    ["gold", [[2, 3, 11, 10]]],
    ["ember", [[4, 5, 2, 2], [8, 4, 2, 2], [10, 7, 2, 2], [5, 8, 2, 2], [9, 10, 2, 2]]],
    ["leaf", [[6, 6, 2, 2], [11, 5, 2, 2]]],
  ],
  gamepad: [
    ["ink", [[2, 5, 12, 1], [1, 6, 1, 4], [14, 6, 1, 4], [3, 10, 10, 1], [2, 11, 2, 1], [12, 11, 2, 1]]],
    ["tealdark", [[2, 6, 12, 4]]],
    ["fog", [[4, 7, 2, 2], [10, 7, 2, 2]]],
    ["blood", [[7, 8, 2, 1]]],
    ["sky", [[5, 8, 1, 1], [10, 8, 1, 1]]],
  ],
  sneaker: [
    ["ink", [[2, 4, 8, 1], [1, 5, 1, 4], [9, 5, 1, 2], [10, 6, 1, 2], [3, 9, 11, 1], [2, 10, 12, 1], [1, 11, 1, 2], [13, 11, 1, 2]]],
    ["ember", [[2, 5, 8, 4], [10, 7, 2, 2]]],
    ["white", [[3, 6, 6, 2]]],
    ["gold", [[4, 10, 8, 1]]],
  ],
  book: [
    ["ink", [[3, 2, 10, 1], [2, 3, 1, 10], [12, 3, 1, 10], [3, 13, 10, 1]]],
    ["blood", [[3, 3, 9, 10]]],
    ["gold", [[5, 3, 1, 10]]],
    ["white", [[7, 5, 4, 1], [7, 7, 4, 1], [7, 9, 3, 1]]],
  ],
  phone: [
    ["ink", [[4, 1, 8, 1], [3, 2, 1, 12], [12, 2, 1, 12], [4, 14, 8, 1]]],
    ["tealdark", [[4, 2, 8, 12]]],
    ["sky", [[5, 4, 6, 8]]],
    ["white", [[7, 12, 2, 1]]],
  ],
  coffee: [
    ["ink", [[3, 3, 10, 1], [2, 4, 1, 8], [12, 4, 1, 8], [3, 12, 10, 1], [11, 5, 3, 2]]],
    ["white", [[3, 4, 9, 8]]],
    ["ember", [[4, 5, 7, 6]]],
    ["gold", [[5, 10, 5, 1]]],
  ],
  gift: [
    ["ink", [[2, 4, 12, 1], [1, 5, 1, 8], [14, 5, 1, 8], [2, 13, 12, 1], [7, 2, 2, 11]]],
    ["mint", [[2, 5, 5, 8], [9, 5, 5, 8]]],
    ["blood", [[7, 5, 2, 8]]],
    ["gold", [[5, 2, 6, 2]]],
  ],
};

const SCALE = 4;
const GRID = 16;

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function renderIcon(groups) {
  const size = GRID * SCALE;
  const rgba = Buffer.alloc(size * size * 4, 0);
  for (const [colorName, cells] of groups) {
    const color = PALETTE[colorName];
    if (!color) throw new Error(`Unknown color ${colorName}`);
    for (const [x, y, w, h] of cells) {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const sx = (x + px) * SCALE;
          const sy = (y + py) * SCALE;
          for (let dy = 0; dy < SCALE; dy++) {
            for (let dx = 0; dx < SCALE; dx++) {
              const ix = ((sy + dy) * size + (sx + dx)) * 4;
              rgba[ix] = color[0];
              rgba[ix + 1] = color[1];
              rgba[ix + 2] = color[2];
              rgba[ix + 3] = color[3];
            }
          }
        }
      }
    }
  }

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const [id, groups] of Object.entries(ICONS)) {
  const file = join(outDir, `${id}.png`);
  writeFileSync(file, renderIcon(groups));
  console.log("wrote", file);
}
