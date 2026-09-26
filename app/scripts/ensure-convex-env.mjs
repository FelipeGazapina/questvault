/**
 * Make sure the deployment behind CONVEX_DEPLOY_KEY has what the app needs, setting only what's
 * missing (existing values are never touched):
 *   - JWT_PRIVATE_KEY / JWKS — Convex Auth signing keys (sign-up and sign-in fail without them)
 *   - SITE_URL — the web app's public URL
 *   - VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT — Web Push
 *   - AUTH_RESEND_KEY — from the environment, when provided (password-reset emails)
 *
 * Secret values go through stdin and are never printed. The VAPID public key is printed (it's
 * public) because the web build needs it as EXPO_PUBLIC_VAPID_PUBLIC_KEY.
 *
 * Usage: CI runs it with CONVEX_DEPLOY_KEY; locally `npm run setup:env` targets the deployment in
 * .env.local (CONVEX_DEPLOYMENT). Optional: SITE_URL, VAPID_SUBJECT, AUTH_RESEND_KEY.
 */
import { execFileSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import webpush from "web-push";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

function existingNames() {
  // `env list` prints NAME=value lines; keep the names only.
  const out = execFileSync(npx, ["convex", "env", "list"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  return new Set(
    out
      .split("\n")
      .map((line) => /^([A-Z0-9_]+)=/.exec(line)?.[1])
      .filter(Boolean),
  );
}

function setVar(name, value) {
  execFileSync(npx, ["convex", "env", "set", name], { input: value, stdio: ["pipe", "ignore", "inherit"] });
  console.log(`Set ${name}`);
}

function authKeys() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const jwk = publicKey.export({ format: "jwk" });
  return {
    JWT_PRIVATE_KEY: pem.trimEnd().replace(/\n/g, " "),
    JWKS: JSON.stringify({ keys: [{ use: "sig", ...jwk }] }),
  };
}

function main() {
  const have = existingNames();

  if (!have.has("JWT_PRIVATE_KEY") || !have.has("JWKS")) {
    // The two must match: regenerate both together.
    const keys = authKeys();
    setVar("JWT_PRIVATE_KEY", keys.JWT_PRIVATE_KEY);
    setVar("JWKS", keys.JWKS);
  }

  if (!have.has("SITE_URL") && process.env.SITE_URL) setVar("SITE_URL", process.env.SITE_URL);

  if (!have.has("VAPID_PUBLIC_KEY") || !have.has("VAPID_PRIVATE_KEY")) {
    const vapid = webpush.generateVAPIDKeys();
    setVar("VAPID_PUBLIC_KEY", vapid.publicKey);
    setVar("VAPID_PRIVATE_KEY", vapid.privateKey);
    console.log(`VAPID public key (set EXPO_PUBLIC_VAPID_PUBLIC_KEY on Railway): ${vapid.publicKey}`);
  } else {
    const pub = execFileSync(npx, ["convex", "env", "get", "VAPID_PUBLIC_KEY"], { encoding: "utf8" }).trim();
    console.log(`VAPID public key (EXPO_PUBLIC_VAPID_PUBLIC_KEY on Railway): ${pub}`);
  }
  if (!have.has("VAPID_SUBJECT")) setVar("VAPID_SUBJECT", process.env.VAPID_SUBJECT ?? "mailto:contato@lypes.agency");

  if (!have.has("AUTH_RESEND_KEY") && process.env.AUTH_RESEND_KEY) setVar("AUTH_RESEND_KEY", process.env.AUTH_RESEND_KEY);

  const missing = ["JWT_PRIVATE_KEY", "JWKS", "SITE_URL", "VAPID_PUBLIC_KEY", "AUTH_RESEND_KEY"].filter(
    (n) => !existingNames().has(n),
  );
  console.log(missing.length ? `Still missing: ${missing.join(", ")}` : "All app variables are set.");
}

main();
