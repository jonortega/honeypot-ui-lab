import Database from "better-sqlite3";
import type { EventInsert, EventRow } from "./types.js";
import type { StatsSummary } from "./types.js";

// Valores seguros por defecto y maximos para paginacion en getEvents()
export const API_EVENTS_DEFAULT_LIMIT = Math.max(
  1,
  Math.min(Number.parseInt(process.env.HNY_API_EVENTS_DEFAULT_LIMIT ?? "", 10) || 50, 1000)
);

export const API_EVENTS_MAX_LIMIT = Math.max(
  API_EVENTS_DEFAULT_LIMIT,
  Math.min(Number.parseInt(process.env.HNY_API_EVENTS_MAX_LIMIT ?? "", 10) || 200, 5000)
);

// Límites para TOP-* del summary
export const API_STATS_TOP_DEFAULT_LIMIT = Math.max(
  1,
  Math.min(Number.parseInt(process.env.HNY_API_STATS_TOP_DEFAULT_LIMIT ?? "", 10) || 10, 100)
);

export const API_STATS_TOP_MAX_LIMIT = Math.max(
  API_STATS_TOP_DEFAULT_LIMIT,
  Math.min(Number.parseInt(process.env.HNY_API_STATS_TOP_MAX_LIMIT ?? "", 10) || 50, 200)
);

// Crea/asegura el esquema de SQLite (events + indices) para arrancar el sistema
export function bootstrap(dbPath: string): void {
  // Abrimos con timeout para evitar bloqueos prolongados en contención
  const db = new Database(dbPath, { timeout: 5000 });

  try {
    // Modo WAL mejora lecturas concurrentes (API) mientras el collector escribe
    db.pragma("journal_mode = WAL");

    // Transacción para crear tabla + índices de forma atómica
    db.exec("BEGIN IMMEDIATE");
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
    db.exec("COMMIT");
  } catch (err) {
    // Si algo falla, revertimos cambios parciales del schema
    try {
      db.exec("ROLLBACK");
    } catch {
      /* noop */
    }
    throw err;
  } finally {
    // No exponemos la conexión; la cerramos aquí para evitar fugas de recursos
    db.close();
  }
}

// Inserta un evento normalizado en 'events' y devuelve el id autoincremental insertado
export function insertEvent(dbPath: string, ev: EventInsert) {
  console.log(`[db/insertEvent] Insertando evento en ${dbPath}`);
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

  const result = stmt.run(params);
  db.close();
  return Number(result.lastInsertRowid);
}

// Lee eventos paginados/filtrados en modo readonly (SQL parametrizado, orden estable, límites seguros)
export function getEvents(
  dbPath: string,
  q: {
    limit?: number;
    offset?: number;
    service?: "ssh" | "http";
    ip?: string;
    from?: string; // ISO-8601 UTC recomendado
    to?: string; // ISO-8601 UTC recomendado
  } = {}
): ReadonlyArray<EventRow> {
  // Helpers de validación ligeros (no "parsean" nada, solo harden inputs)
  const toSafeLimit = (n: unknown): number => {
    const v = typeof n === "number" ? Math.floor(n) : Number.NaN;
    if (!Number.isFinite(v) || v <= 0) return API_EVENTS_DEFAULT_LIMIT;
    return Math.min(v, API_EVENTS_MAX_LIMIT);
  };
  const toSafeOffset = (n: unknown): number => {
    const v = typeof n === "number" ? Math.floor(n) : Number.NaN;
    if (!Number.isFinite(v) || v < 0) return 0;
    return v;
  };
  const isIso8601 = (s: unknown): s is string => {
    if (typeof s !== "string") return false;
    // Permite "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ss[.sss]Z"
    return /^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/.test(s);
  };

  const safe: {
    limit: number;
    offset: number;
    service?: "ssh" | "http";
    ip?: string;
    from?: string;
    to?: string;
  } = {
    limit: toSafeLimit(q.limit),
    offset: toSafeOffset(q.offset),
  };

  if (q.service === "ssh" || q.service === "http") {
    safe.service = q.service;
  }
  if (typeof q.ip === "string" && q.ip.length > 0 && q.ip.length <= 255) {
    // No hacemos parsing de IP aquí; solo tratamos la cadena como dato (parametrizado).
    safe.ip = q.ip;
  }
  if (isIso8601(q.from)) safe.from = q.from;
  if (isIso8601(q.to)) safe.to = q.to;

  // Si el rango de fechas es inválido (from > to), devolvemos vacío de forma explícita.
  if (safe.from && safe.to && safe.from > safe.to) {
    return [];
  }

  const db = new Database(dbPath, { readonly: true });

  try {
    // SELECT explícito de columnas (evita sorpresas si el esquema cambia)
    let sql = `
      SELECT
        id,
        ts_utc,
        src_ip,
        src_port,
        service,
        username,
        password,
        http_method,
        http_path,
        http_status,
        user_agent,
        raw
      FROM events
    `.trim();

    const where: string[] = [];
    const params: Record<string, unknown> = {};

    if (safe.service) {
      where.push("service = @service");
      params.service = safe.service;
    }
    if (safe.ip) {
      where.push("src_ip = @ip");
      params.ip = safe.ip;
    }
    if (safe.from) {
      where.push("ts_utc >= @from");
      params.from = safe.from;
    }
    if (safe.to) {
      where.push("ts_utc <= @to");
      params.to = safe.to;
    }

    if (where.length > 0) {
      sql += " WHERE " + where.join(" AND ");
    }

    // Orden determinista: primero por fecha DESC y, a igualdad, por id DESC
    sql += " ORDER BY ts_utc DESC, id DESC";

    // LIMIT/OFFSET seguros (validados arriba)
    sql += " LIMIT @limit OFFSET @offset";
    params.limit = safe.limit;
    params.offset = safe.offset;

    const stmt = db.prepare(sql);
    const rows = stmt.all(params) as EventRow[];

    // Defensa de salida (muy conservadora): garantiza tipos "nullables" coherentes
    // No transformamos contenido (p.ej. raw JSON string), solo nos aseguramos de no devolver undefined
    const normalized = rows.map((r) => ({
      id: r.id,
      ts_utc: r.ts_utc,
      src_ip: r.src_ip,
      src_port: r.src_port ?? null,
      service: r.service,
      username: r.username ?? null,
      password: r.password ?? null,
      http_method: r.http_method ?? null,
      http_path: r.http_path ?? null,
      http_status: r.http_status ?? null,
      user_agent: r.user_agent ?? null,
      raw: r.raw ?? null,
    })) as ReadonlyArray<EventRow>;

    return normalized;
  } finally {
    // Asegura cierre incluso ante excepciones
    db.close();
  }
}

// Devuelve el total de eventos (con filtros opcionales); si no hay filtros, cuenta toda la tabla
export function countEvents(
  dbPath: string,
  q?: { service?: "ssh" | "http"; ip?: string; from?: string; to?: string }
): number {
  const db = new Database(dbPath, { readonly: true });

  // Construir la query base
  let sql = "SELECT COUNT(*) AS count FROM events";
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  // Añadir filtros opcionales
  if (q?.service) {
    conditions.push("service = @service");
    params.service = q.service;
  }
  if (q?.ip) {
    conditions.push("src_ip = @ip");
    params.ip = q.ip;
  }
  if (q?.from) {
    conditions.push("ts_utc >= @from");
    params.from = q.from;
  }
  if (q?.to) {
    conditions.push("ts_utc <= @to");
    params.to = q.to;
  }

  // Concatenar WHERE si hay filtros
  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  // Ejecutar consulta con parámetros
  const row = db.prepare(sql).get(params) as { count: number };

  db.close();
  return row.count;
}

// Calcula el resumen para /api/stats/summary: totalEvents, byDay y TOP-N (IPs, usernames, paths) con filtros
export function getStatsSummary(
  dbPath: string,
  opts?: {
    service?: "ssh" | "http";
    from?: string; // ISO-8601 UTC (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss(.sss)Z)
    to?: string; // ISO-8601 UTC
    topLimit?: number;
  }
): StatsSummary {
  // --- saneo inputs ---
  const isoRegex = /^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/;

  const service = opts?.service === "ssh" || opts?.service === "http" ? opts.service : undefined;

  const from = typeof opts?.from === "string" && isoRegex.test(opts.from) ? opts.from : undefined;

  const to = typeof opts?.to === "string" && isoRegex.test(opts.to) ? opts.to : undefined;

  // rango incoherente → devolver vacío
  if (from && to && from > to) {
    return {
      totalEvents: 0,
      byDay: [],
      topIPs: [],
      topUsernames: [],
      topPaths: [],
    };
  }

  const topLimitRaw = typeof opts?.topLimit === "number" ? Math.floor(opts!.topLimit!) : NaN;
  const topLimit =
    Number.isFinite(topLimitRaw) && topLimitRaw > 0
      ? Math.min(topLimitRaw, API_STATS_TOP_MAX_LIMIT)
      : API_STATS_TOP_DEFAULT_LIMIT;

  // --- construir WHERE común y params ---
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (service) {
    where.push("service = @service");
    params.service = service;
  }
  if (from) {
    where.push("ts_utc >= @from");
    params.from = from;
  }
  if (to) {
    where.push("ts_utc <= @to");
    params.to = to;
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";

  const db = new Database(dbPath, { readonly: true });
  try {
    // 1) totalEvents
    const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM events${whereClause}`).get(params) as
      | { count?: number }
      | undefined;
    const totalEvents = Number.isFinite(totalRow?.count as number) ? Number(totalRow!.count) : 0;

    // 2) byDay
    const byDayRows = db
      .prepare(
        `
        SELECT date(ts_utc) AS d, COUNT(*) AS c
        FROM events
        ${whereClause}
        GROUP BY d
        ORDER BY d ASC
        `.trim()
      )
      .all(params) as Array<{ d: string; c: number }>;

    const byDay = byDayRows.map((r) => ({
      date: r.d,
      count: Number.isFinite(r.c) ? r.c : 0,
    }));

    // 3) topIPs
    const topIpRows = db
      .prepare(
        `
        SELECT src_ip AS v, COUNT(*) AS c
        FROM events
        ${whereClause}${whereClause ? " AND" : " WHERE"} src_ip IS NOT NULL AND src_ip <> ''
        GROUP BY v
        ORDER BY c DESC, v ASC
        LIMIT @topLimit
        `.trim()
      )
      .all({ ...params, topLimit }) as Array<{ v: string; c: number }>;

    const topIPs = topIpRows.map((r) => ({
      value: r.v,
      count: Number.isFinite(r.c) ? r.c : 0,
    }));

    // 4) topUsernames
    const topUserRows = db
      .prepare(
        `
        SELECT username AS v, COUNT(*) AS c
        FROM events
        ${whereClause}${whereClause ? " AND" : " WHERE"} username IS NOT NULL AND username <> ''
        GROUP BY v
        ORDER BY c DESC, v ASC
        LIMIT @topLimit
        `.trim()
      )
      .all({ ...params, topLimit }) as Array<{ v: string; c: number }>;

    const topUsernames = topUserRows.map((r) => ({
      value: r.v,
      count: Number.isFinite(r.c) ? r.c : 0,
    }));

    // 5) topPaths
    const topPathRows = db
      .prepare(
        `
        SELECT http_path AS v, COUNT(*) AS c
        FROM events
        ${whereClause}${whereClause ? " AND" : " WHERE"} http_path IS NOT NULL AND http_path <> ''
        GROUP BY v
        ORDER BY c DESC, v ASC
        LIMIT @topLimit
        `.trim()
      )
      .all({ ...params, topLimit }) as Array<{ v: string; c: number }>;

    const topPaths = topPathRows.map((r) => ({
      value: r.v,
      count: Number.isFinite(r.c) ? r.c : 0,
    }));

    // salida normalizada y read-only
    return {
      totalEvents,
      byDay,
      topIPs,
      topUsernames,
      topPaths,
    };
  } finally {
    db.close();
  }
}

// Comprueba integridad y metadatos de la DB en readonly (integrity_check, page_size, user_version)
export function getDbHealth(dbPath: string): {
  ok: boolean;
  pageSize: number;
  userVersion: number;
} {
  let db: Database.Database | undefined;
  try {
    db = new Database(dbPath, { readonly: true, fileMustExist: true });

    // PRAGMAs en modo simple: devuelven valores primitivos
    const pageSize = Number(db.pragma("page_size", { simple: true })); // p.ej. 4096
    const userVersion = Number(db.pragma("user_version", { simple: true })); // versión de app/schema
    const integrity = String(db.pragma("integrity_check", { simple: true })); // "ok" si íntegra

    const ok = integrity.toLowerCase() === "ok" && Number.isFinite(pageSize) && Number.isFinite(userVersion);

    return {
      ok,
      pageSize: Number.isFinite(pageSize) ? pageSize : 0,
      userVersion: Number.isFinite(userVersion) ? userVersion : 0,
    };
  } catch {
    // Si no existe el fichero o hay corrupción/permiso denegado
    return { ok: false, pageSize: 0, userVersion: 0 };
  } finally {
    try {
      db?.close();
    } catch {
      /* noop */
    }
  }
}

export type { EventInsert, EventRow } from "./types.js";
export type { StatsSummary, StatsTopItem, StatsByDayItem } from "./types.js";
