import os from "node:os";
import path from "node:path";

process.env.SMARTSHAMBAAI_DB_PATH = path.join(os.tmpdir(), `smartshambaai-test-${process.pid}-${Date.now()}.db`);
// Force deterministic provider in tests regardless of what's running on the machine.
process.env.OLLAMA_HOST = "http://127.0.0.1:1";
delete process.env.HOSTED_AI_API_KEY;
process.env.AI_REPLY_BUDGET_MS = "300";
