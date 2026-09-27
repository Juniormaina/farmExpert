#!/usr/bin/env node
/**
 * Runs vitest and reports success from the JSON results file.
 * Needed because Node 22 + tinypool can crash during worker teardown
 * after every test has already passed.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const resultsPath = path.join(cwd, "vitest-results.json");

try {
  fs.unlinkSync(resultsPath);
} catch {
  // ignore missing file
}

const result = spawnSync(
  "npx",
  ["vitest", "run", "--reporter=default", "--reporter=json", "--outputFile", resultsPath],
  { cwd, encoding: "utf8", shell: true, env: process.env }
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (!fs.existsSync(resultsPath)) {
  console.error("Vitest did not write results; treating as failure.");
  process.exit(result.status === 0 ? 1 : result.status ?? 1);
}

const report = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
const failed = Number(report.numFailedTests ?? 0);
const passed = Number(report.numPassedTests ?? 0);
const filesFailed = Number(report.numFailedTestSuites ?? 0);

console.log(`\nVitest results: ${passed} passed, ${failed} failed (${filesFailed} suites failed).`);

if (failed > 0 || filesFailed > 0) {
  process.exit(1);
}
if (passed === 0) {
  console.error("No tests passed.");
  process.exit(1);
}
process.exit(0);
