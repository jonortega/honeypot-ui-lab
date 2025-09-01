import fs from "fs";
import { bootstrap } from "../src/index.js";

const dbPath = process.env.HNY_DB_PATH || "../../data/events.db";

// Si existe el fichero de DB, lo eliminamos
if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
  console.log(`[db:reset] Removed existing DB file at ${dbPath}`);
}

// Volvemos a crear la estructura
bootstrap(dbPath);
console.log(`[db:reset] Bootstrapped new DB schemaat ${dbPath}`);
