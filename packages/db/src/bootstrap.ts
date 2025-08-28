import { bootstrap } from "./index.js";

const path = process.env.HNY_DB_PATH || "/data/events.db";
bootstrap(path);
console.log(`[db] bootstrap ok at ${path}`);
