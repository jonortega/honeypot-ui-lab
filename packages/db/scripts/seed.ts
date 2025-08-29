import { bootstrap, insertEvent } from "../src/index.js";
import type { EventInsert } from "../src/types.js";

const path = process.env.HNY_DB_PATH || "../../data/events.db";

bootstrap(path);
console.log(`[db] bootstrap ok at ${path}`);

const ev: EventInsert = {
  ts_utc: new Date().toISOString(),
  src_ip: "127.0.0.1",
  src_port: 54321,
  service: "ssh",
  username: "admin",
  password: "123456",
  raw: JSON.stringify({ test: true, note: "seed" }),
};

insertEvent(path, ev);
console.log("[db] inserted 1 event");
