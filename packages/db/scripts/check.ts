import { countEvents } from "../src/index.js";
const path = process.env.HNY_DB_PATH || "../../data/events.db";
console.log(`[db] total events: ${countEvents(path)}`);
