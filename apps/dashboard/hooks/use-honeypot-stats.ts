"use client";

import useSWR from "swr";
import { getSummaryStats } from "@/lib/api";
import type { SummaryStats } from "@/lib/types";

type Options = {
  refreshInterval?: number; // ms, default 10s
  revalidateOnFocus?: boolean; // default false
};

export function useHoneypotStats(opts: Options = {}) {
  const { refreshInterval = 10_000, revalidateOnFocus = false } = opts;

  const { data, error, isLoading, mutate } = useSWR<SummaryStats>(
    "/api/internal/stats/summary",
    () => getSummaryStats(),
    { refreshInterval, revalidateOnFocus, dedupingInterval: 5_000 }
  );

  return { stats: data, error, isLoading, refresh: mutate };
}
