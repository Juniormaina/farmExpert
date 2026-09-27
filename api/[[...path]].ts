import { createApp } from "../server/dist/api/app.js";
import { initSchema, isSeeded } from "../server/dist/database/connection.js";
import { resetDemoData } from "../server/dist/database/seed.js";

// server/src/index.ts does this, but a serverless entrypoint has to do it here
// because it imports the app directly instead of booting the HTTP listener.
initSchema();
if (!isSeeded()) {
  resetDemoData();
}

const app = createApp();

export default app;
