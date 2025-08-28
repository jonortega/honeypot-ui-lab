import Database from "better-sqlite3";

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
      raw JSON
    );
    CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts_utc);
    CREATE INDEX IF NOT EXISTS idx_events_ip ON events(src_ip);
    CREATE INDEX IF NOT EXISTS idx_events_service ON events(service);
  `);
  return db; // devolveremos la conexión si la necesitamos
}
