import * as dotenv from "dotenv";
import express from "express";
import { getEvents, countEvents, getStatsSummary } from "../../../packages/db/src/index.js";
import { toInt, parseIso, parseService } from "./validation/validation.js";
import { makeAuthRequired } from "./middleware/auth.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

// __dirname shim para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config básica ---
const app = express();
app.disable("x-powered-by"); // menos fingerprinting
app.use(express.json({ limit: "100kb", strict: true })); // no aceptamos bodies grandes (solo GETs)

// Cargar .env.local desde la raíz del repo
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });

// Env (acepta variantes con typos para no romper en local)
const ROOT_DIR = path.resolve(__dirname, "../../..");
const DB_PATH = path.resolve(ROOT_DIR, process.env.HNY_DB_PATH || "data/events.db");
const DASHBOARD_ORIGIN = process.env.DASHBOARD_BASE_URL || process.env.BASHBOARD_BASE_URL || "";
const ADMIN_TOKEN = process.env.HNY_ADMIN_TOKEN;
if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 24) {
  throw new Error("HNY_ADMIN_TOKEN is required and must be >= 24 chars");
}

// CORS mínimo (sin dependencia extra)
app.use((req, res, next) => {
  if (DASHBOARD_ORIGIN) {
    const origin = req.headers.origin as string | undefined;
    if (origin && origin === DASHBOARD_ORIGIN) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    }
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// --- Función de validación de auth ---
const authRequired = makeAuthRequired(ADMIN_TOKEN);

// --- Health básico ---
app.get("/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, private");
  res.json({ ok: true });
});

// --- GET /api/events ---
// Lista paginada + total filtrado. Usa getEvents() y countEvents().
app.get("/api/events", authRequired, (req, res) => {
  console.log("[api] GET /api/events", {
    ip: req.ip,
    service: req.query.service,
    from: req.query.from,
    to: req.query.to,
    limit: req.query.limit,
    offset: req.query.offset,
    userAgent: req.headers["user-agent"],
  });

  // 1) Validar/sanear query
  const limit = toInt(req.query.limit, 50, { min: 1, max: 10_000 }); // el clamp real se hace en la capa DB
  const offset = toInt(req.query.offset, 0, { min: 0, max: 100_000_000 });
  const service = parseService(req.query.service);
  const ip = typeof req.query.ip === "string" && req.query.ip.length <= 255 ? req.query.ip : undefined;
  const from = parseIso(req.query.from);
  const to = parseIso(req.query.to);

  // 2) Rango incoherente → 400
  if (from && to && from > to) {
    return res.status(400).json({ error: "invalid_range" });
  }

  // 3) Construir filtros seguros
  const filters = { service, ip, from, to };

  // 4) Consultar DB (total + items). La capa DB ya aplica clamps y SQL parametrizado.
  const total = countEvents(DB_PATH, filters);
  const items = getEvents(DB_PATH, { ...filters, limit, offset });

  // 5) Responder (no reflejar inputs sin validar en cabeceras)
  res.setHeader("Cache-Control", "no-store, private");
  res.type("application/json; charset=utf-8");
  res.status(200).json({ total, limit, offset, items });
});

// --- GET /api/stats/summary ---
// Agregados: totalEvents, byDay[], topIPs[], topUsernames[], topPaths[]
app.get("/api/stats/summary", authRequired, (req, res) => {
  // 1) Validar/sanear filtros
  const service = parseService(req.query.service);
  const from = parseIso(req.query.from);
  const to = parseIso(req.query.to);

  // opcionalmente permitir ?top=...
  const top = toInt(req.query.top, NaN, { min: 1, max: 1_000 });
  const topLimit = Number.isFinite(top) ? top : undefined;

  // 2) Rango incoherente → 400
  if (from && to && from > to) {
    return res.status(400).json({ error: "invalid_range" });
  }

  // 3) Consultar DB
  const summary = getStatsSummary(DB_PATH, { service, from, to, topLimit });

  // 4) Responder
  res.setHeader("Cache-Control", "no-store, private");
  res.type("application/json; charset=utf-8");
  res.status(200).json(summary);
});

// --- 404 ---
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

// --- Error handler (mensaje genérico, log interno) ---
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api:error]", err);
  res.status(500).json({ error: "internal_error" });
});

// --- Arranque ---
const port = Number(process.env.API_PORT ?? 3000);
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
