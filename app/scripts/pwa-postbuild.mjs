#!/usr/bin/env node
/**
 * After `expo export`, add PWA manifest + icons to dist/.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const images = join(root, "assets", "images");
const iconsOut = join(dist, "icons");
const iconScript = join(root, "..", "design", "render-pwa-icons.mjs");

if (!existsSync(dist)) {
  console.error("pwa-postbuild: dist/ missing — run expo export first");
  process.exit(1);
}

if (existsSync(iconScript)) {
  execSync(`node "${iconScript}"`, { stdio: "inherit" });
}

mkdirSync(iconsOut, { recursive: true });
for (const name of ["icon-192.png", "icon-512.png", "favicon.png"]) {
  const src = join(images, name);
  if (!existsSync(src)) {
    console.error(`pwa-postbuild: missing ${src}`);
    process.exit(1);
  }
  copyFileSync(src, join(iconsOut, name));
}

const manifest = {
  name: "QuestVault",
  short_name: "QuestVault",
  description: "Family missions, rewards and screen time — an RPG for parents and kids.",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "portrait",
  theme_color: "#13100d",
  background_color: "#13100d",
  lang: "pt-BR",
  prefer_related_applications: false,
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};

writeFileSync(join(dist, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const swSrc = join(root, "public", "sw.js");
if (existsSync(swSrc)) {
  copyFileSync(swSrc, join(dist, "sw.js"));
}

console.log("pwa-postbuild: wrote manifest.json, sw.js, icons/ → dist/");
