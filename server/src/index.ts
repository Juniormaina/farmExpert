import "dotenv/config";
import { createApp } from "./api/app.js";
import { initSchema, isSeeded } from "./database/connection.js";
import { resetDemoData } from "./database/seed.js";

initSchema();
if (!isSeeded()) {
  resetDemoData();
}

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ShambaAI server listening on http://localhost:${PORT}`);
});
