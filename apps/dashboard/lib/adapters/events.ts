import type { EventItem, EventsResponse, ServiceType } from "@/lib/types";

// Helpers pequeños y puros (reutilizables en tests)
const toArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

const toInt = (v: unknown, fallback = 0): number => {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const toStr = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : v == null ? fallback : String(v));

const toNullableInt = (v: unknown): number | null => {
  const n = toInt(v, NaN);
  return Number.isFinite(n) ? n : null;
};

const toNullableStr = (v: unknown): string | null => {
  const s = v == null ? null : String(v);
  return s && s.length > 0 ? s : null;
};

const parseJSONSafe = (v: unknown): unknown => {
  if (typeof v !== "string") return v ?? null;
  try {
    return JSON.parse(v);
  } catch {
    return v; // deja string si no es JSON válido
  }
};

const toService = (v: unknown, fallback: ServiceType = "ssh"): ServiceType => {
  const s = String(v ?? "").toLowerCase();
  return s === "ssh" || s === "http" ? (s as ServiceType) : fallback;
};

const normalizeTimestamp = (v: unknown): string => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  let d = new Date(s);
  if (isNaN(d.getTime())) {
    const patchedT = s.includes("T") ? s : s.replace(" ", "T");
    const withTZ = /[zZ]|[+-]\d{2}:\d{2}$/.test(patchedT) ? patchedT : patchedT + "Z";
    d = new Date(withTZ);
  }
  return isNaN(d.getTime()) ? "" : d.toISOString(); // siempre ISO UTC
};

// Normalizador de un item
export function normalizeEventItem(raw: any): EventItem {
  return {
    id: toInt(raw?.id, 0),
    ts_utc: normalizeTimestamp(raw?.ts_utc),
    src_ip: toStr(raw?.src_ip, ""),
    src_port: toNullableInt(raw?.src_port),
    service: toService(raw?.service, "ssh"),
    username: toNullableStr(raw?.username),
    password: toNullableStr(raw?.password),
    http_method: toNullableStr(raw?.http_method),
    http_path: toNullableStr(raw?.http_path),
    http_status: raw?.http_status == null ? null : toInt(raw?.http_status),
    user_agent: toNullableStr(raw?.user_agent),
    raw: raw?.raw == null ? null : parseJSONSafe(raw?.raw),
  };
}

// Normalizador del payload completo de /api/events
export function normalizeEventsResponse(raw: any): EventsResponse {
  const items = toArray<any>(raw?.items).map(normalizeEventItem);

  return {
    total: toInt(raw?.total, 0),
    limit: toInt(raw?.limit, 50),
    offset: toInt(raw?.offset, 0),
    items,
  };
}
