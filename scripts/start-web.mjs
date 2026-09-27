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
  console.error(`[smartshambaai] Missing ${indexHtml}`);
  console.error("Run `npm run build` before `npm start` / `npm run start:web`.");
  process.exit(1);
}

const pwaBits = [
  ["manifest.webmanifest", fs.existsSync(manifest)],
  ["sw.js", fs.existsSync(sw)],
  ["registerSW.js", fs.existsSync(path.join(clientDist, "registerSW.js"))]
];
for (const [name, ok] of pwaBits) {
  console.log(`[smartshambaai] PWA asset ${name}: ${ok ? "ok" : "MISSING"}`);
}

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.SERVE_CLIENT = process.env.SERVE_CLIENT === "0" ? "0" : "1";
process.env.CLIENT_DIST_PATH = process.env.CLIENT_DIST_PATH || clientDist;

console.log(`[smartshambaai] CLIENT_DIST_PATH=${process.env.CLIENT_DIST_PATH}`);
console.log(`[smartshambaai] SERVE_CLIENT=${process.env.SERVE_CLIENT}`);

const child = spawn("npm", ["run", "start", "--workspace", "server"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
