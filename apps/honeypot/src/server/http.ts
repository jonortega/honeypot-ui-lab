import express, { type Request, type Response, type NextFunction } from "express";
import { handleEvent } from "../collector/collector.js";
import { getConfig } from "../config.js";

const TRUST_PROXY = process.env.HNY_TRUST_PROXY === "1"; // por defecto NO confiamos XFF

// Middleware de cabeceras duras
const securityHeaders: import("express").RequestHandler = (_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": "default-src 'none'",
  });
  next();
};

function clamp(s: string | undefined, max = 1024) {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) : s;
}

function clientIp(req: Request) {
  if (TRUST_PROXY) {
    const xf = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(xf) ? xf[0] : xf?.split(",")[0])?.trim();
    return ip || req.socket.remoteAddress || "unknown";
  }
  return req.socket.remoteAddress || "unknown";
}

function clientPort(req: Request) {
  const p = (req.socket as any).remotePort;
  return typeof p === "number" ? p : undefined;
}

export function startHTTPServer() {
  const { HNY_HTTP_PORT } = getConfig();
  const app = express();

  // Endurecimiento mínimo
  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);
  app.use(securityHeaders);

  // Log **de cada request** (resumen, sin cuerpos)
  app.use((req, _res, next) => {
    const ip = clientIp(req);
    const ua = clamp(String(req.headers["user-agent"] || ""), 120);
    console.log(`[hp/http] ${req.method} ${req.path} from ${ip} ua="${ua}"`);
    next();
  });

  // Parsers con límites estrictos (baja interacción)
  app.use(express.json({ limit: "8kb" }));
  app.use(express.urlencoded({ extended: false, limit: "8kb" }));

  // Helper para registrar un evento HTTP
  const record = (req: Request, status: number, extra?: Record<string, unknown>) => {
    const raw = JSON.stringify({
      ...extra,
      query: req.query,
      headers: {
        host: req.headers.host,
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"],
        accept: req.headers["accept"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
      },
    });

    handleEvent({
      ts_utc: new Date().toISOString(),
      src_ip: clientIp(req),
      src_port: clientPort(req),
      service: "http",
      http_method: req.method,
      http_path: req.path,
      http_status: status,
      user_agent: clamp(req.headers["user-agent"] as string | undefined, 256),
      raw: clamp(raw, 1024),
    });
  };

  // Ruta tentadora: login falso
  app.post("/login", (req, res) => {
    const user = typeof req.body?.username === "string" ? clamp(req.body.username, 64) : undefined;
    const pass = typeof req.body?.password === "string" ? String(req.body.password) : undefined;
    console.log(`[hp/http] /login attempt ip=${clientIp(req)} user=${user ?? "-"} password=${pass ?? "-"}`);
    record(req, 401, { body: { username: user, password: pass } });
    res.status(401).send("Unauthorized");
  });

  const bait = [
    // admin/auth
    "/admin",
    "/admin/login",
    "/auth/login",
    "/api/login",
    "/api/auth/login",
    // WordPress
    "/wp-login.php",
    "/xmlrpc.php",
    "/wp-json/wp/v2/users",
    // Paneles comunes
    "/phpmyadmin",
    "/phpinfo.php",
    "/config.php",
    // Fugas típicas
    "/.env",
    "/.git/HEAD",
    "/.git/config",
    // Status/endpoints comunes
    "/server-status",
    "/actuator/health",
    // Upload
    "/upload",
    "/api/upload",
  ];

  for (const routePath of bait) {
    app.all(routePath, (req, res) => {
      const ip = clientIp(req);
      console.log(`[hp/http] bait hit ${req.method} ${routePath} from ${ip}`);
      // 403 para ficheros “sensibles”, 401 para login/paneles, 404 resto
      const status =
        routePath.startsWith("/.git") || routePath === "/.env"
          ? 403
          : routePath.includes("login") ||
            routePath.includes("auth") ||
            routePath.includes("upload") ||
            routePath === "/phpmyadmin"
          ? 401
          : 404;
      record(req, status);
      res.sendStatus(status);
    });
  }

  // Catch-all: registra cualquier otra ruta/método
  app.all("*", (req, res) => {
    console.log(`[hp/http] 404 ${req.method} ${req.path} from ${clientIp(req)}`);
    record(req, 404);
    res.status(404).send("Not Found");
  });

  // Manejador de errores: nunca exponemos stack al cliente
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const ip = clientIp(req);
    const e = err as any;
    const kind = e?.type === "entity.too.large" ? "payload_too_large" : "error";
    console.warn(`[hp/http] ${kind} on ${req.method} ${req.path} from ${ip}`);
    record(req, 400, { error: kind });
    res.status(400).send("Bad Request");
  });

  app.listen(HNY_HTTP_PORT, "0.0.0.0", () => {
    console.log(`[hp/http] HTTP honeypot escuchando en puerto ${HNY_HTTP_PORT}`);
  });
}
