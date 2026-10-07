import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp } from "./api/app.js";
import { initSchema, isSeeded } from "./database/connection.js";
import { resetDemoData } from "./database/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env first (shared aliases), then server/.env overrides for this package.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

initSchema();
if (!isSeeded()) {
  resetDemoData();
}

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Farm Expert server listening on http://localhost:${PORT}`);
  if (process.env.SERVE_CLIENT === "1" || process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.log(`UI expected at http://localhost:${PORT}/ (set SERVE_CLIENT=0 for API-only)`);
  }
});
