import { insertEvent, bootstrap } from "../src/index.js";
import { EventInsert } from "../src/types.js";

const dbPath = process.env.HNY_DB_PATH || "../../data/events.db";

// Aseguramos que la tabla exista
bootstrap(dbPath);
console.log(`[db] bootstrap ok at ${dbPath}`);

// Generar algunos eventos de prueba (hardcodeados aquí, puedes randomizarlos si quieres)
const samples = [
  {
    ts_utc: new Date().toISOString(),
    src_ip: "185.23.44.101",
    src_port: 51234,
    service: "ssh",
    username: "admin",
    password: "123456",
    raw: JSON.stringify({ note: "brute force attempt" }),
  },
  {
    ts_utc: new Date().toISOString(),
    src_ip: "203.0.113.45",
    src_port: 44321,
    service: "ssh",
    username: "root",
    password: "toor",
    raw: JSON.stringify({ note: "common root login attempt" }),
  },
  {
    ts_utc: new Date().toISOString(),
    src_ip: "91.198.174.10",
    src_port: 39852,
    service: "http",
    http_method: "GET",
    http_path: "/wp-login.php",
    http_status: 404,
    user_agent: "Mozilla/5.0 (compatible; Nmap Scripting Engine)",
    raw: JSON.stringify({ note: "scanner probing wordpress login" }),
  },
  {
    ts_utc: new Date().toISOString(),
    src_ip: "37.120.145.200",
    src_port: 60211,
    service: "http",
    http_method: "POST",
    http_path: "/login",
    http_status: 401,
    user_agent: "curl/8.0.1",
    raw: JSON.stringify({ note: "invalid login POST request" }),
  },
] satisfies EventInsert[];

for (const ev of samples) {
  const id = insertEvent(dbPath, ev);
  console.log(`[db:seed] Inserted event id=${id}`);
}
