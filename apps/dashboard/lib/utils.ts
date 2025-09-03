import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
