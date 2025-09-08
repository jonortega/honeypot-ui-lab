import { insertEvent } from "db";
import type { EventInsert } from "db";
import { getConfig } from "../config.js";

const { HNY_DB_PATH } = getConfig();

export function handleEvent(ev: EventInsert) {
  try {
    insertEvent(HNY_DB_PATH, ev);
    console.log("[hp/collector] Evento insertado:", ev);
  } catch (err) {
    console.error("[hp/collector] Error insertando evento", err);
  }
}
