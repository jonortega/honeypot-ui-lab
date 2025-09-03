import type { SummaryStats } from "@/lib/types";

// Formato crudo que viene de tu API
type RawValueCount = {
  value?: string;
  ip?: string;
  src_ip?: string;
  count?: number;
  total?: number;
};

type RawSummary = {
  totalEvents?: number;
  byDay?: Array<{ date?: string; count?: number }>;
  topIPs?: RawValueCount[];
  topUsernames?: RawValueCount[];
  topPaths?: RawValueCount[];
};

// Helpers reutilizables
export function toArray<T>(x: T[] | null | undefined): T[] {
  return Array.isArray(x) ? x : ([] as T[]);
}

export function mapValueCount<K extends "ip" | "username" | "path">(
  arr: RawValueCount[] | null | undefined,
  labelKey: K
) {
  return toArray<RawValueCount>(arr)
    .map((x) => {
      const label = x.value ?? x.ip ?? x.src_ip ?? "";
      const count = Number(x.count ?? x.total ?? 0);
      return { [labelKey]: String(label || "(unknown)"), count } as Record<K | "count", string | number>;
    })
    .filter((x) => (x[labelKey] as string).length > 0);
}

export function normalizeSummary(raw: RawSummary): SummaryStats {
  const byDay = toArray(raw?.byDay).map((d) => ({
    date: String(d?.date ?? ""),
    count: Number(d?.count ?? 0),
  }));

  return {
    totalEvents: Number(raw?.totalEvents ?? 0),
    byDay,
    topIPs: mapValueCount(raw?.topIPs, "ip") as SummaryStats["topIPs"],
    topUsernames: mapValueCount(raw?.topUsernames, "username") as SummaryStats["topUsernames"],
    topPaths: mapValueCount(raw?.topPaths, "path") as SummaryStats["topPaths"],
  };
}
