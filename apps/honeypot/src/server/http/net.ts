import type { Request } from "express";

const TRUST_PROXY = process.env.HNY_TRUST_PROXY === "1";

export function clientIp(req: Request): string {
  if (TRUST_PROXY) {
    const xf = req.headers["x-forwarded-for"];
    const ip = (Array.isArray(xf) ? xf[0] : xf?.split(",")[0])?.trim();
    return ip || req.socket.remoteAddress || "unknown";
  }
  return req.socket.remoteAddress || "unknown";
}

export function clientPort(req: Request): number | undefined {
  const p = (req.socket as any).remotePort;
  return typeof p === "number" ? p : undefined;
}

export { TRUST_PROXY };
