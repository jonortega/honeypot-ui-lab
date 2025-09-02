import type express from "express";

// Exporta un *factory* para inyectar el token desde index.ts
export function makeAuthRequired(adminToken: string) {
  return function authRequired(req: express.Request, res: express.Response, next: express.NextFunction) {
    const hdr = req.header("authorization") ?? "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
    if (token !== adminToken) {
      console.warn(
        `[api] 401 Unauthorized: token="${token}" from ${req.ip} (${req.headers["user-agent"]}) endpoint="${req.originalUrl}"`
      );
      res.setHeader("WWW-Authenticate", 'Bearer realm="admin"');
      return res.status(401).json({ error: "unauthorized" });
    }
    console.log(`[api] 200 Authorized: from ${req.ip} (${req.headers["user-agent"]}) endpoint="${req.originalUrl}"`);
    return next();
  };
}
