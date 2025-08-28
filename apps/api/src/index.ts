import express from "express";

const app = express();
const ADMIN_TOKEN = process.env.HNY_ADMIN_TOKEN ?? "change-me";

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/secure-ping", (req, res) => {
  const auth = req.header("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (token !== ADMIN_TOKEN)
    return res.status(401).json({ error: "unauthorized" });
  res.json({ pong: true });
});

const port = Number(process.env.API_PORT ?? 3000);
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
