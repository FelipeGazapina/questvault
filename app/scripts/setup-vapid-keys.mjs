/**
 * Generate VAPID keys for Web Push (no Firebase/OneSignal) and set on Convex.
 *
 * Usage:
 *   npm run setup:vapid-keys
 *
 * Also set EXPO_PUBLIC_VAPID_PUBLIC_KEY on Railway to the printed public key.
 */
import { execSync } from "node:child_process";
import webpush from "web-push";

function run(cmd) {
  execSync(cmd, { stdio: "inherit", shell: true });
}

function deploymentFlags(deployment) {
  if (process.env.CONVEX_DEPLOY_KEY) return "";
  if (deployment.startsWith("prod:")) return "--prod";
  if (deployment.startsWith("dev:")) return "--deployment dev";
  if (deployment.startsWith("local:")) {
    throw new Error("Point CONVEX_DEPLOYMENT at cloud production or dev, not local.");
  }
  const slug = deployment.includes(":") ? deployment.split(":")[1] : deployment;
  return `--deployment ${slug}`;
}

function main() {
  const deployment = process.env.CONVEX_DEPLOYMENT;
  if (!deployment || deployment.startsWith("anonymous:")) {
    console.error("Set CONVEX_DEPLOYMENT in .env.local to your cloud deployment.");
    process.exit(1);
  }

  const keys = webpush.generateVAPIDKeys();
  const subject = "mailto:support@questvault.app";
  const flags = deploymentFlags(deployment);

  console.log(`Setting VAPID keys on ${deployment}…`);
  run(`npx convex env set VAPID_PUBLIC_KEY "${keys.publicKey}" ${flags}`);
  run(`npx convex env set VAPID_PRIVATE_KEY "${keys.privateKey}" ${flags}`);
  run(`npx convex env set VAPID_SUBJECT "${subject}" ${flags}`);

  console.log("\nDone. Add to Railway (and rebuild web app):");
  console.log(`EXPO_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
}

main();
