#!/usr/bin/env node
/**
 * Export Expo web build into website/app/ for PWA install at /app/
 * Usage: node website/scripts/build-pwa.mjs
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const appDir = join(root, "app");
const outDir = join(root, "website", "app");
const node = process.execPath;
const npx = join(node, "..", "node_modules", "npm", "bin", "npx-cli.js");

const iconsScript = join(root, "design", "render-pwa-icons.mjs");
if (existsSync(iconsScript)) {
  execSync(`"${node}" "${iconsScript}"`, { stdio: "inherit" });
}

console.log("\nExporting Expo web → website/app/ …\n");
execSync(`"${node}" "${npx}" expo export --platform web --output-dir "${outDir}"`, {
  cwd: appDir,
  stdio: "inherit",
  env: { ...process.env },
});

console.log("\nDone. Serve website/ and open /app/ to install the PWA.\n");
