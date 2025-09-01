// Exporta TODO lo que uses desde index.ts
export const isoRegex =
  /^(\d{4}-\d{2}-\d{2})(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/;

export function toInt(
  v: unknown,
  def: number,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {}
): number {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(Math.max(Math.floor(n), min), max);
}

export function parseService(s: unknown): "ssh" | "http" | undefined {
  return s === "ssh" || s === "http" ? s : undefined;
}

export function parseIso(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  return isoRegex.test(s) ? s : undefined;
}
