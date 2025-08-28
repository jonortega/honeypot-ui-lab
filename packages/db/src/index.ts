import Database from "better-sqlite3";
import type { EventInsert } from "./types.js";

export function bootstrap(dbPath: string) {
  const db = new Database(dbPath);
  // Esquema mínimo del MVP
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts_utc TEXT NOT NULL,
      src_ip TEXT NOT NULL,
      src_port INTEGER,
      service TEXT NOT NULL,
      username TEXT,
      password TEXT,
      http_method TEXT,
      http_path TEXT,
      http_status INTEGER,
      user_agent TEXT,
      raw TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts_utc);
    CREATE INDEX IF NOT EXISTS idx_events_ip ON events(src_ip);
    CREATE INDEX IF NOT EXISTS idx_events_service ON events(service);
  `);
  return db; // devolveremos la conexión
}

export function insertEvent(dbPath: string, ev: EventInsert) {
  const db = new Database(dbPath);
  const stmt = db.prepare(`
    INSERT INTO events (
      ts_utc, src_ip, src_port, service,
      username, password,
      http_method, http_path, http_status, user_agent,
      raw
    ) VALUES (
      @ts_utc, @src_ip, @src_port, @service,
      @username, @password,
      @http_method, @http_path, @http_status, @user_agent,
      @raw
    )
  `);

  const params = {
    ts_utc: ev.ts_utc,
    src_ip: ev.src_ip,
    src_port: ev.src_port ?? null,
    service: ev.service,
    username: ev.username ?? null,
    password: ev.password ?? null,
    http_method: ev.http_method ?? null,
    http_path: ev.http_path ?? null,
    http_status: ev.http_status ?? null,
    user_agent: ev.user_agent ?? null,
    raw: ev.raw ?? null,
  };

  stmt.run(params);
  db.close();
}

export function countEvents(dbPath: string): number {
  const db = new Database(dbPath, { readonly: true });
  const row = db.prepare(`SELECT COUNT(*) AS count FROM events`).get() as {
    count: number;
  };
  db.close();
  return row.count;
}
