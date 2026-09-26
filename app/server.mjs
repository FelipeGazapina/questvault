/**
 * Serves Expo static web export on Railway (PWA at /).
 * Listens on process.env.PORT.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, "dist");
const port = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Pages, the service worker and the manifest must be revalidated on every load, or a browser keeps
 * running the previous deploy's bundle (and its baked-in backend URL) for as long as it's cached.
 * Bundles and assets carry a content hash in their name, so they can be cached for good.
 */
const HASHED = /^\/(_expo\/static|assets)\/.*[.-][0-9a-f]{16,}\.[a-z0-9]+$/i;

function cacheControl(urlPath, file) {
  if (!file || file.endsWith(".html") || /\/(sw\.js|manifest\.json)$/.test(file)) return "no-cache";
  if (HASHED.test(urlPath)) return "public, max-age=31536000, immutable";
  return "public, max-age=3600";
}

function send(res, status, body, type = "text/plain", cache = "no-cache") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": cache });
  res.end(body);
}

const STATIC_EXT = /\.(json|js|webmanifest|png|ico|svg|woff2|txt|css|map)$/i;

function resolvePath(urlPath) {
  const safe = urlPath.split("?")[0].replace(/\.\./g, "");
  const rel = safe === "/" ? "index.html" : safe.replace(/^\//, "");
  const file = join(dist, rel);
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (!extname(safe) && existsSync(`${file}.html`)) return `${file}.html`;
  const indexInDir = join(file, "index.html");
  if (existsSync(indexInDir)) return indexInDir;
  if (STATIC_EXT.test(safe)) return null;
  return join(dist, "index.html");
}

createServer((req, res) => {
  try {
    const file = resolvePath(req.url ?? "/");
    if (!file) {
      send(res, 404, "Not found");
      return;
    }
    const ext = extname(file);
    const data = readFileSync(file);
    const urlPath = (req.url ?? "/").split("?")[0];
    send(res, 200, data, MIME[ext] ?? "application/octet-stream", cacheControl(urlPath, file));
  } catch {
    send(res, 404, "Not found");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`QuestVault web app → http://0.0.0.0:${port}`);
});
