import type { Request } from "express";
import { handleEvent } from "../../collector/collector.js";
import { clamp } from "./utils.js";
import { clientIp, clientPort } from "./net.js";

export function record(req: Request, status: number, extra?: Record<string, unknown>) {
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
}
