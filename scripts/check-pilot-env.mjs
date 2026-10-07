#!/usr/bin/env node
/**
 * Fails a pilot build when the host is missing a support contact, is about to
 * store data on an ephemeral disk, or has a channel that this pilot does not use.
 *
 * Local `npm run build` does not set PILOT_REQUIRE_SUPPORT, so it is unchanged.
 */
import os from "node:os";
import path from "node:path";

const PLACEHOLDERS = ["example", "changeme", "todo", "your-email", "your-phone", "0000000", "replace-me"];

export function pilotEnvProblems(env = process.env) {
  if (env.PILOT_REQUIRE_SUPPORT !== "1") return [];
  const problems = [];
  const contact = (env.VITE_SUPPORT_CONTACT ?? "").trim();
  const lowered = contact.toLowerCase();
  if (contact.length < 5 || PLACEHOLDERS.some((word) => lowered.includes(word))) {
    problems.push("VITE_SUPPORT_CONTACT must be the real pilot support route. Do not invent one.");
  }
  const dbPath = env.FARMEXPERT_DB_PATH ?? "";
  const resolved = dbPath ? path.resolve(dbPath) : "";
  const temp = path.resolve(os.tmpdir());
  if (!dbPath || resolved === temp || resolved.startsWith(temp + path.sep) || dbPath.includes(`${path.sep}tmp${path.sep}`)) {
    problems.push("FARMEXPERT_DB_PATH must be a persistent disk path, not /tmp.");
  }
  if ((env.HOSTED_AI_API_KEY ?? "").trim() || (env.MODELSCOPE_API_KEY ?? "").trim()) {
    problems.push("Hosted AI must stay unset for this pilot.");
  }
  if ((env.SMS_WEBHOOK_TOKEN ?? "").trim() || (env.USSD_WEBHOOK_TOKEN ?? "").trim()) {
    problems.push("SMS and USSD gateways must stay unset. This pilot is web only.");
  }
  return problems;
}

function isMain() {
  const entry = process.argv[1] ?? "";
  return entry.endsWith(`${path.sep}check-pilot-env.mjs`);
}

if (isMain()) {
  const problems = pilotEnvProblems();
  if (problems.length === 0) {
    if (process.env.PILOT_REQUIRE_SUPPORT === "1") {
      console.log(JSON.stringify({ event: "pilot_env_ok" }));
    }
    process.exit(0);
  }
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
