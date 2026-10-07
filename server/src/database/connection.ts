import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
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

// Returns whether the directory exists and is writable, creating it if needed.
// Never throws: a serverless bundle is read-only apart from the temp dir, so a
// failed mkdir here is a reason to relocate the database, not to crash.
function ensureWritableDir(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveDbPath(): string {
  const configured =
    process.env.FARMEXPERT_DB_PATH ??
    process.env.SMARTSHAMBAAI_DB_PATH ??
    process.env.SHAMBAAI_DB_PATH ??
    process.env.DATABASE_PATH;
  if (configured) {
    ensureWritableDir(path.dirname(path.resolve(configured)));
    return configured;
  }
  if (ensureWritableDir(DATA_DIR)) {
    return path.join(DATA_DIR, "farmexpert.db");
  }
  const fallback = path.join(os.tmpdir(), "farmexpert.db");
  ensureWritableDir(path.dirname(fallback));
  return fallback;
}

const DB_PATH = resolveDbPath();

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");

function columnNames(table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

export function initSchema(): void {
  // Databases created before multi-crop support store maize bags only. The
  // table holds nothing but reseedable demo data, so rebuild it.
  const existing = columnNames("market_prices");
  if (existing.length > 0 && !existing.includes("unit")) {
    db.exec("DROP TABLE market_prices");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS market_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      market TEXT NOT NULL,
      county TEXT NOT NULL,
      crop TEXT NOT NULL,
      price_per_unit INTEGER NOT NULL,
      unit TEXT NOT NULL,
      unit_kg INTEGER NOT NULL,
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
