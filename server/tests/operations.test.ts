import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/api/app.js";
import { farmerError } from "../src/api/requestId.js";
import { demoResetAllowed } from "../src/api/security.js";
import {
  db,
  dbFilePath,
  ephemeralDatabaseBlocked,
  initSchema,
  legacyMarketTable,
  selectDatabaseFile,
  storageClass,
  storageForOpen
} from "../src/database/connection.js";
import { pilotEnvProblems } from "../../scripts/check-pilot-env.mjs";
import { backupDatabase, restoreDatabase } from "../../scripts/sqlite-backup.mjs";

const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");

const app = createApp();

describe("health and request ids", () => {
  it("reports demo mode and database reachability without a filesystem path", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      dataMode: "demo",
      database: "ok",
      storage: "ephemeral"
    });
    expect(JSON.stringify(res.body)).not.toMatch(/\/tmp|farmexpert\.db|API_KEY/);
    expect(res.headers["x-request-id"]).toMatch(/^FE-[0-9A-F]{6}$/);
  });

  it("logs the original API path and leaves the question out of the log", async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const lines: string[] = [];
    const spy = vi.spyOn(console, "log").mockImplementation((line?: unknown) => {
      lines.push(String(line));
    });
    try {
      const res = await request(app).post("/api/chat").send({ message: "hello from the pilot log check", locale: "en" });
      expect(res.status).toBe(200);
      const logged = lines
        .map((line) => {
          try {
            return JSON.parse(line) as { path?: string; method?: string };
          } catch {
            return null;
          }
        })
        .find((row) => row?.method === "POST");
      expect(logged?.path).toBe("/api/chat");
      expect(JSON.stringify(logged)).not.toMatch(/hello from the pilot log check/);
    } finally {
      spy.mockRestore();
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  });

  it("returns a reference instead of an internal error message", async () => {
    const res = await request(app).post("/api/chat").set("Content-Type", "application/json").send("{");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers["x-request-id"]).toMatch(/^FE-[0-9A-F]{6}$/);
    expect(JSON.stringify(res.body)).not.toMatch(/SyntaxError|node_modules|\n\s*at /);
    if (res.status >= 500) {
      expect(res.body.error).toBe(farmerError(res.headers["x-request-id"]));
    }
  });
});

describe("demo reset", () => {
  let previousNodeEnv: string | undefined;

  afterEach(() => {
    delete process.env.DEMO_RESET_TOKEN;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  });

  it("stays available outside production", () => {
    expect(demoResetAllowed(undefined, {})).toBe(true);
  });

  it("is closed in production until the admin token matches", async () => {
    previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const hidden = await request(app).post("/api/demo/reset");
    expect(hidden.status).toBe(404);

    process.env.DEMO_RESET_TOKEN = "pilot-reset-secret";
    const denied = await request(app).post("/api/demo/reset").set("x-farmexpert-token", "pilot-reset-secret-no");
    expect(denied.status).toBe(404);
    const allowed = await request(app).post("/api/demo/reset").set("x-farmexpert-token", "pilot-reset-secret");
    expect(allowed.status).toBe(200);
  });
});

describe("storage classification", () => {
  it("treats the temp directory as ephemeral and a mounted disk as persistent", () => {
    expect(storageClass(path.join(os.tmpdir(), "farmexpert.db"))).toBe("ephemeral");
    expect(storageClass("/var/data/farmexpert.db")).toBe("persistent");
    expect(dbFilePath().includes(os.tmpdir())).toBe(true);
  });

  it("uses a writable configured path and relocates when that directory cannot be created", () => {
    const locations = { dataDir: "/app/server/data", tempDir: "/tmp" };
    expect(selectDatabaseFile("/var/data/farmexpert.db", () => true, locations)).toEqual({
      filePath: "/var/data/farmexpert.db",
      usedConfiguredPath: true
    });
    expect(selectDatabaseFile("/var/data/farmexpert.db", (dir) => dir === locations.dataDir, locations)).toEqual({
      filePath: "/app/server/data/farmexpert.db",
      usedConfiguredPath: false
    });
    expect(selectDatabaseFile("/var/data/farmexpert.db", () => false, locations).filePath).toBe("/tmp/farmexpert.db");
    expect(storageForOpen("/app/server/data/farmexpert.db", true)).toBe("ephemeral");
    expect(storageForOpen("/var/data/farmexpert.db", false)).toBe("persistent");
  });

  it("blocks an ephemeral database only for production", () => {
    const tempFile = path.join(os.tmpdir(), "farmexpert.db");
    expect(ephemeralDatabaseBlocked(tempFile, { NODE_ENV: "production" })).toBe(true);
    expect(ephemeralDatabaseBlocked(tempFile, { NODE_ENV: "production", ALLOW_EPHEMERAL_DB: "1" })).toBe(false);
    expect(ephemeralDatabaseBlocked("/var/data/farmexpert.db", { NODE_ENV: "production" })).toBe(false);
    expect(ephemeralDatabaseBlocked(tempFile, { NODE_ENV: "test" })).toBe(false);
  });

  it("rebuilds only a legacy market table", () => {
    expect(legacyMarketTable([])).toBe(false);
    expect(legacyMarketTable(["id", "price_per_unit"])).toBe(true);
    expect(legacyMarketTable(["id", "unit"])).toBe(false);
  });

  it("keeps feedback when the schema is applied again", () => {
    db.prepare("INSERT INTO feedback (rating, comment, context, created_at) VALUES (?, ?, ?, ?)").run(
      "helpful",
      "keep-me",
      "web",
      "2026-10-07T00:00:00.000Z"
    );
    initSchema();
    const row = db.prepare("SELECT comment FROM feedback WHERE comment = ?").get("keep-me") as { comment: string };
    expect(row.comment).toBe("keep-me");
    const version = db.prepare("SELECT value FROM schema_meta WHERE key = 'version'").get() as { value: string };
    expect(version.value).toBe("1");
    db.prepare("DELETE FROM feedback WHERE comment = ?").run("keep-me");
  });
});

describe("backup and restore", () => {
  it("restores a feedback row from a backup file", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fe-backup-"));
    const source = path.join(directory, "live.db");
    const backup = path.join(directory, "copy.db");
    const database = new DatabaseSync(source);
    database.exec("CREATE TABLE feedback (id INTEGER PRIMARY KEY, comment TEXT)");
    database.prepare("INSERT INTO feedback (comment) VALUES (?)").run("pilot-note");
    database.close();

    backupDatabase(source, backup);
    const changed = new DatabaseSync(source);
    changed.prepare("INSERT INTO feedback (comment) VALUES (?)").run("later");
    changed.close();

    restoreDatabase(backup, source);
    const restored = new DatabaseSync(source);
    const rows = restored.prepare("SELECT comment FROM feedback ORDER BY id").all() as Array<{ comment: string }>;
    restored.close();
    expect(rows.map((row) => row.comment)).toEqual(["pilot-note"]);
  });
});

describe("pilot environment check", () => {
  const good = {
    PILOT_REQUIRE_SUPPORT: "1",
    VITE_SUPPORT_CONTACT: "nakuru-pilot@farmexpert.test",
    FARMEXPERT_DB_PATH: "/var/data/farmexpert.db",
    HOSTED_AI_API_KEY: "",
    SMS_WEBHOOK_TOKEN: "",
    USSD_WEBHOOK_TOKEN: ""
  };

  it("accepts a configured pilot and ignores local builds", () => {
    expect(pilotEnvProblems(good)).toEqual([]);
    expect(pilotEnvProblems({})).toEqual([]);
  });

  it("rejects a missing contact, /tmp storage, hosted AI, and live gateways", () => {
    expect(pilotEnvProblems({ ...good, VITE_SUPPORT_CONTACT: "" }).length).toBeGreaterThan(0);
    expect(pilotEnvProblems({ ...good, VITE_SUPPORT_CONTACT: "changeme" }).length).toBeGreaterThan(0);
    expect(pilotEnvProblems({ ...good, FARMEXPERT_DB_PATH: "/tmp/farmexpert.db" }).length).toBeGreaterThan(0);
    expect(pilotEnvProblems({ ...good, HOSTED_AI_API_KEY: "secret" })).toContain("Hosted AI must stay unset for this pilot.");
    expect(pilotEnvProblems({ ...good, SMS_WEBHOOK_TOKEN: "token" }).join(" ")).toMatch(/SMS and USSD/);
    expect(pilotEnvProblems({ ...good, USSD_WEBHOOK_TOKEN: "token" }).join(" ")).toMatch(/SMS and USSD/);
  });
});
