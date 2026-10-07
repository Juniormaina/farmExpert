#!/usr/bin/env node
/**
 * Consistent SQLite backup and restore for the Farm Expert pilot database.
 *
 * Backup uses VACUUM INTO, so it is safe while the server is running.
 * Restore copies that file into place. Stop the server before restoring,
 * otherwise a live process can write over the restored file.
 *
 * Usage:
 *   node scripts/sqlite-backup.mjs backup
 *   node scripts/sqlite-backup.mjs restore <backup-file>
 *
 * Reads FARMEXPERT_DB_PATH (default server/data/farmexpert.db).
 * Writes backups under FARMEXPERT_BACKUP_DIR (default ./backups).
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite");

export function quoteSqlitePath(filePath) {
  return filePath.replaceAll("'", "''");
}

export function backupDatabase(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.rmSync(destinationPath, { force: true });
  const database = new DatabaseSync(sourcePath);
  try {
    database.exec(`VACUUM INTO '${quoteSqlitePath(path.resolve(destinationPath))}'`);
  } finally {
    database.close();
  }
}

export function restoreDatabase(backupPath, destinationPath) {
  if (!fs.existsSync(backupPath)) {
    throw new Error("Backup file was not found.");
  }
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  const temporary = `${destinationPath}.restore`;
  fs.copyFileSync(backupPath, temporary);
  fs.renameSync(temporary, destinationPath);
  fs.rmSync(`${destinationPath}-wal`, { force: true });
  fs.rmSync(`${destinationPath}-shm`, { force: true });
}

function defaultDbPath() {
  return process.env.FARMEXPERT_DB_PATH ?? path.resolve("server/data/farmexpert.db");
}

function isMain() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return entry.endsWith(`${path.sep}sqlite-backup.mjs`);
}

if (isMain()) {
  const [command, backupArg] = process.argv.slice(2);
  const dbPath = defaultDbPath();
  if (command === "backup") {
    const directory = process.env.FARMEXPERT_BACKUP_DIR ?? path.resolve("backups");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const destination = path.join(directory, `farmexpert-${stamp}.db`);
    backupDatabase(dbPath, destination);
    console.log(JSON.stringify({ event: "database_backup", file: path.basename(destination) }));
  } else if (command === "restore") {
    if (!backupArg) {
      console.error("Usage: node scripts/sqlite-backup.mjs restore <backup-file>");
      process.exit(1);
    }
    restoreDatabase(backupArg, dbPath);
    console.log(JSON.stringify({ event: "database_restore", ok: true }));
  } else {
    console.error("Usage: node scripts/sqlite-backup.mjs backup | restore <backup-file>");
    process.exit(1);
  }
}
