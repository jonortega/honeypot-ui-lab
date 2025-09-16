import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TimeRange } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Acepta Date | string | null/undefined y devuelve Date | null
export function parseUtcDate(value: unknown): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value ?? "").trim();
  if (!s) return null;

  // Intento 1: tal cual
  let d = new Date(s);

  // Intento 2: normalizar formatos tipo "YYYY-MM-DD HH:mm:ss"
  if (isNaN(d.getTime())) {
    const patchedT = s.includes("T") ? s : s.replace(" ", "T");
    const withTZ = /[zZ]|[+-]\d{2}:\d{2}$/.test(patchedT) ? patchedT : patchedT + "Z";
    d = new Date(withTZ);
  }

  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateLike: unknown, opts: Intl.DateTimeFormatOptions = {}) {
  const d = parseUtcDate(dateLike);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
    ...opts,
  }).format(d);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num);
}

export const isLikelyIP = (term: string) =>
  /^(?:\d{1,3}\.){3}\d{1,3}$/.test(term.trim()) || /^[0-9a-f:]+$/i.test(term.trim()); // ipv4 or ipv6 (very loose)

export function rangeToFromTo(range: TimeRange): { from?: string; to?: string } {
  const now = new Date();
  if (range === "24h") {
    const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  if (range === "7d") {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  // "custom": no cambiamos filtros de fecha aquí (podrás añadir datepicker luego)
  return {};
}

export function statusIsSuccess(http_status?: number | null): boolean | undefined {
  if (typeof http_status !== "number") return undefined;
  return http_status >= 100 && http_status < 400;
}
