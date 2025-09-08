import express, { type Request, type Response, type NextFunction } from "express";
import { getConfig } from "../config.js";
import { securityHeaders } from "./http/securityHeaders.js";
import { clamp, logHttp } from "./http/utils.js";
import { clientIp, TRUST_PROXY } from "./http/net.js";
import { baitRoutes } from "./http/bait.js";
import { record } from "./http/recorder.js";

export function startHTTPServer() {
  const { HNY_HTTP_PORT } = getConfig();
  const app = express();

  // Endurecimiento mínimo
  app.disable("x-powered-by");
  app.set("trust proxy", TRUST_PROXY);
  app.use(securityHeaders);

  // Log de cada request (sin cuerpos)
  app.use((req, _res, next) => {
    const ip = clientIp(req);
    const ua = clamp(String(req.headers["user-agent"] || ""), 120);
    logHttp(`${req.method} ${req.path} from ${ip} ua="${ua}"`);
    next();
  });

  // Parsers con límites estrictos
  app.use(express.json({ limit: "8kb" }));
  app.use(express.urlencoded({ extended: false, limit: "8kb" }));

  // Login falso
  app.post("/login", (req, res) => {
    const user = typeof req.body?.username === "string" ? clamp(req.body.username, 64) : undefined;
    const pass = typeof req.body?.password === "string" ? String(req.body.password) : undefined;
    logHttp(`/login attempt ip=${clientIp(req)} user=${user ?? "-"} password=${pass ?? "-"}`);
    record(req, 401, { body: { username: user, password: pass } });
    res.status(401).send("Unauthorized");
  });

  // Rutas cebo
  for (const routePath of baitRoutes) {
    app.all(routePath, (req, res) => {
      const ip = clientIp(req);
      logHttp(`bait hit ${req.method} ${routePath} from ${ip}`);
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

  // Catch-all
  app.all("*", (req, res) => {
    logHttp(`404 ${req.method} ${req.path} from ${clientIp(req)}`);
    record(req, 404);
    res.status(404).send("Not Found");
  });

  // Errores
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const e = err as any;
    const kind = e?.type === "entity.too.large" ? "payload_too_large" : "error";
    logHttp(`${kind} on ${req.method} ${req.path} from ${clientIp(req)}`);
    record(req, 400, { error: kind });
    res.status(400).send("Bad Request");
  });

  app.listen(HNY_HTTP_PORT, "0.0.0.0", () => {
    logHttp(`HTTP honeypot escuchando en puerto ${HNY_HTTP_PORT}`);
  });
}
