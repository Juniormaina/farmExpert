#!/usr/bin/env node
/**
 * Production entry for Render (and local smoke checks):
 * builds are assumed done; this verifies client/dist, then starts the API
 * with SERVE_CLIENT so Express serves the PWA.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDist = path.join(root, "client", "dist");
const indexHtml = path.join(clientDist, "index.html");
const manifest = path.join(clientDist, "manifest.webmanifest");
const sw = path.join(clientDist, "sw.js");

if (!fs.existsSync(indexHtml)) {
  console.error(`[farmexpert] Missing ${indexHtml}`);
  console.error("Run `npm run build` before `npm start` / `npm run start:web`.");
  process.exit(1);
}

const pwaBits = [
  ["manifest.webmanifest", fs.existsSync(manifest)],
  ["sw.js", fs.existsSync(sw)],
  ["registerSW.js", fs.existsSync(path.join(clientDist, "registerSW.js"))]
];
for (const [name, ok] of pwaBits) {
  if (name === "registerSW.js" && !ok && fs.existsSync(sw)) {
    console.log("[farmexpert] PWA asset registerSW.js: bundled in the app (update prompt registers the service worker)");
    continue;
  }
  console.log(`[farmexpert] PWA asset ${name}: ${ok ? "ok" : "MISSING"}`);
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.SERVE_CLIENT = process.env.SERVE_CLIENT === "0" ? "0" : "1";
process.env.CLIENT_DIST_PATH = process.env.CLIENT_DIST_PATH || clientDist;

const configuredDb = process.env.FARMEXPERT_DB_PATH;
if (configuredDb) {
  const directory = path.dirname(path.resolve(configuredDb));
  try {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`[farmexpert] database directory ready: ${directory}`);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "error";
    console.error(
      `[farmexpert] database directory was not created (${directory}, ${code}). The server will use its local data directory until a disk is mounted there.`
    );
  }
}

console.log(`[farmexpert] CLIENT_DIST_PATH=${process.env.CLIENT_DIST_PATH}`);
console.log(`[farmexpert] SERVE_CLIENT=${process.env.SERVE_CLIENT}`);

const child = spawn("npm", ["run", "start", "--workspace", "server"], {
  cwd: root,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
