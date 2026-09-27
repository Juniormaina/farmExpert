import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Loaded via createRequire (not a static ESM import) because Vite/vite-node's
// builtin-module resolution strips the "node:" prefix for modules it doesn't
// recognize (node:sqlite is still experimental and isn't in Node's public
// builtinModules list), which breaks resolution under Vitest. A plain
// require() call bypasses Vite's import analysis entirely.
const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DB_PATH = process.env.SHAMBAAI_DB_PATH ?? path.join(DATA_DIR, "shambaai.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT NOT NULL,
      county TEXT NOT NULL,
      crop TEXT NOT NULL,
      price_per_bag INTEGER NOT NULL,
      bag_size_kg INTEGER NOT NULL,
      classification TEXT NOT NULL,
      source TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      freshness TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fertilizer_listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      package_size_kg INTEGER NOT NULL,
      price_per_bag INTEGER NOT NULL,
      supplier TEXT NOT NULL,
      county TEXT NOT NULL,
      availability TEXT NOT NULL,
      source TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      freshness TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS request_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM market_prices").get() as { count: number };
  return row.count > 0;
}
