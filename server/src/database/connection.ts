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

export function selectDatabaseFile(
  configured: string | undefined,
  directoryWritable: (directory: string) => boolean,
  locations: { dataDir: string; tempDir: string }
): { filePath: string; usedConfiguredPath: boolean } {
  if (configured) {
    const absolute = path.resolve(configured);
    if (directoryWritable(path.dirname(absolute))) {
      return { filePath: absolute, usedConfiguredPath: true };
    }
  }
  if (directoryWritable(locations.dataDir)) {
    return { filePath: path.join(locations.dataDir, "farmexpert.db"), usedConfiguredPath: false };
  }
  return { filePath: path.join(locations.tempDir, "farmexpert.db"), usedConfiguredPath: false };
}

function configuredDatabasePath(): string | undefined {
  return (
    process.env.FARMEXPERT_DB_PATH ??
    process.env.SMARTSHAMBAAI_DB_PATH ??
    process.env.SHAMBAAI_DB_PATH ??
    process.env.DATABASE_PATH
  );
}

const databaseLocations = { dataDir: DATA_DIR, tempDir: os.tmpdir() };

function openDatabase(filePath: string) {
  const database = new DatabaseSync(filePath);
  database.exec("PRAGMA journal_mode = WAL;");
  return database;
}

const configured = configuredDatabasePath();
let choice = selectDatabaseFile(configured, ensureWritableDir, databaseLocations);
if (configured && !choice.usedConfiguredPath) {
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: "error",
      event: "database_directory_unwritable",
      detail:
        "The configured database directory could not be created. Using the application data directory. On Render, add a disk mounted at that path. This copy does not survive a deploy."
    })
  );
}

let opened: ReturnType<typeof openDatabase>;
try {
  opened = openDatabase(choice.filePath);
} catch (err) {
  if (!choice.usedConfiguredPath) throw err;
  // eslint-disable-next-line no-console
  console.error(
    JSON.stringify({
      level: "error",
      event: "database_open_failed",
      error: err instanceof Error ? err.name : "Error",
      detail:
        "The configured database file could not be opened. Using the application data directory. On Render, add a disk mounted at that path. This copy does not survive a deploy."
    })
  );
  choice = selectDatabaseFile(undefined, ensureWritableDir, databaseLocations);
  opened = openDatabase(choice.filePath);
}

const DB_PATH = choice.filePath;
const configuredPathUnused = Boolean(configured) && !choice.usedConfiguredPath;

export function dbFilePath(): string {
  return DB_PATH;
}

/** A path under the OS temp directory does not survive a host restart. */
export function storageClass(filePath: string): "persistent" | "ephemeral" {
  const resolved = path.resolve(filePath);
  const temp = path.resolve(os.tmpdir());
  if (resolved === temp || resolved.startsWith(temp + path.sep)) return "ephemeral";
  return "persistent";
}

export function ephemeralDatabaseBlocked(filePath: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "production" && storageClass(filePath) === "ephemeral" && env.ALLOW_EPHEMERAL_DB !== "1";
}

/** Ephemeral when the opened file is temporary, or when the configured disk path could not be used. */
export function storageForOpen(filePath: string, configuredPathWasUnused: boolean): "persistent" | "ephemeral" {
  if (configuredPathWasUnused) return "ephemeral";
  return storageClass(filePath);
}

export function databaseStorage(): "persistent" | "ephemeral" {
  return storageForOpen(DB_PATH, configuredPathUnused);
}

export const db = opened;

function columnNames(table: string): string[] {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as unknown as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

/** True only for a pre-multi-crop demo table. Feedback is never part of this check. */
export function legacyMarketTable(columns: string[]): boolean {
  return columns.length > 0 && !columns.includes("unit");
}

export function databaseReachable(): boolean {
  try {
    db.prepare("SELECT 1 AS ok").get();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: "error",
        event: "database_unavailable",
        error: err instanceof Error ? err.name : "Error"
      })
    );
    return false;
  }
}

export function initSchema(): void {
  // Databases created before multi-crop support store maize bags only. That
  // table holds reseedable demo prices, not farmer feedback, so rebuild it.
  const existing = columnNames("market_prices");
  if (legacyMarketTable(existing)) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: "warn", event: "rebuild_legacy_market_table" }));
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

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating TEXT NOT NULL,
      comment TEXT,
      context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback (created_at);

    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.prepare("INSERT OR IGNORE INTO schema_meta (key, value) VALUES ('version', '1')").run();
}

export function isSeeded(): boolean {
  const row = db.prepare("SELECT COUNT(*) as count FROM market_prices").get() as { count: number };
  return row.count > 0;
}
