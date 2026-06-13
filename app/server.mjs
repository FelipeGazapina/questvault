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
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, type = "text/plain") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "public, max-age=3600" });
  res.end(body);
}

function resolvePath(urlPath) {
  const safe = urlPath.split("?")[0].replace(/\.\./g, "");
  let file = join(dist, safe === "/" ? "index.html" : safe);
  if (existsSync(file) && statSync(file).isFile()) return file;
  if (!extname(safe) && existsSync(`${file}.html`)) return `${file}.html`;
  const indexInDir = join(file, "index.html");
  if (existsSync(indexInDir)) return indexInDir;
  return join(dist, "index.html");
}

createServer((req, res) => {
  try {
    const file = resolvePath(req.url ?? "/");
    const ext = extname(file);
    const data = readFileSync(file);
    send(res, 200, data, MIME[ext] ?? "application/octet-stream");
  } catch {
    send(res, 404, "Not found");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`QuestVault web app → http://0.0.0.0:${port}`);
});
