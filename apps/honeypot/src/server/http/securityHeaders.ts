import type { RequestHandler } from "express";

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-site",
    "Content-Security-Policy": "default-src 'none'",
  });
  next();
};
