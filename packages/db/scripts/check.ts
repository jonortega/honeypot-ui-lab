import { get } from "http";
import { countEvents, getDbHealth } from "../src/index.js";

const path = process.env.HNY_DB_PATH || "../../data/events.db";

const total = countEvents(path);
const health = getDbHealth(path);

console.log(`[db] total events: ${total}`);
console.log(
  `[db] health: ok=${health.ok}, pageSize=${health.pageSize}, userVersion=${health.userVersion}`
);
