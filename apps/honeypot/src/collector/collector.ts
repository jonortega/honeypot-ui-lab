import { insertEvent } from "../../../../packages/db/src/index.js";
import type { EventInsert } from "../../../../packages/db/src/types.js";

const dbPath = process.env.HNY_DB_PATH || "../../data/events.db";

export function handleEvent(ev: EventInsert) {
  try {
    insertEvent(dbPath, ev);
    console.log("[hp/collector] Evento insertado:", ev);
  } catch (err) {
    console.error("[hp/collector] Error insertando evento", err);
  }
}
