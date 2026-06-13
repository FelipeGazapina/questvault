/**
 * Generates PWA / app icons (192 & 512) for QuestVault.
 * Run: node design/render-pwa-icons.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const appImages = join(here, "..", "app", "assets", "images");
const webPwa = join(here, "..", "website", "assets", "pwa");

const BG = [0x1a, 0x1c, 0x2c, 0xff];
const PIXELS = [
  [[0x33, 0x3c, 0x57, 0xff], [[14, 6, 20, 2]]],
  [[0x25, 0x71, 0x79, 0xff], [[12, 8, 24, 4]]],
  [[0xef, 0x7d, 0x57, 0xff], [[14, 12, 20, 16]]],
  [[0x33, 0x3c, 0x57, 0xff], [[18, 18, 4, 4], [26, 18, 4, 4]]],
  [[0xb1, 0x3e, 0x53, 0xff], [[18, 30, 12, 2]]],
  [[0x38, 0xb7, 0x64, 0xff], [[14, 32, 20, 10]]],
  [[0xff, 0xcd, 0x75, 0xff], [[20, 32, 8, 10]]],
];

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

function renderIcon(size) {
  const scale = size / 48;
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = BG[0];
    rgba[i * 4 + 1] = BG[1];
    rgba[i * 4 + 2] = BG[2];
    rgba[i * 4 + 3] = BG[3];
  }
  for (const [color, cells] of PIXELS) {
    for (const [x, y, w, h] of cells) {
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const sx = Math.floor((x + px) * scale);
          const sy = Math.floor((y + py) * scale);
          const sw = Math.max(1, Math.ceil(scale));
          const sh = Math.max(1, Math.ceil(scale));
          for (let dy = 0; dy < sh; dy++) {
            for (let dx = 0; dx < sw; dx++) {
              const ix = sy + dy;
              const iy = sx + dx;
              if (ix >= size || iy >= size) continue;
              const o = (ix * size + iy) * 4;
              rgba[o] = color[0];
              rgba[o + 1] = color[1];
              rgba[o + 2] = color[2];
              rgba[o + 3] = color[3];
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
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(appImages, { recursive: true });
mkdirSync(webPwa, { recursive: true });

for (const size of [192, 512]) {
  const png = renderIcon(size);
  writeFileSync(join(appImages, `icon-${size}.png`), png);
  writeFileSync(join(webPwa, `icon-${size}.png`), png);
}

writeFileSync(join(appImages, "icon.png"), renderIcon(512));
writeFileSync(join(appImages, "favicon.png"), renderIcon(192));
console.log("wrote PWA icons to app/assets/images and website/assets/pwa");
