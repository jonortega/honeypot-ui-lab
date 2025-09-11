import useSWR from "swr";
import { getSummaryStats, getEvents, getHealth } from "@/lib/api";
import type { EventFilters } from "@/lib/types";

export function useStats() {
  return useSWR("summary-stats", getSummaryStats, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function useEvents(filters: EventFilters = {}) {
  const key = ["events", filters];
  const cleanFilters = { ...filters };
  if (cleanFilters.service === "all") {
    delete cleanFilters.service;
  }

  return useSWR(key, () => getEvents(cleanFilters), {
    refreshInterval: 15000, // Refresh every 15 seconds
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useHealth() {
  return useSWR("health", getHealth, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
}

export const useSummaryStats = useStats;
