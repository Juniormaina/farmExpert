import { initSchema } from "../src/database/connection.js";
import { resetDemoData } from "../src/database/seed.js";

initSchema();
resetDemoData();
