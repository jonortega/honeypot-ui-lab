import useSWR from "swr";
import { getSummaryStats, getEvents, getHealth } from "@/lib/api";
import type { EventFilters } from "@/lib/types";

export function useSummaryStats() {
  return useSWR("summary-stats", getSummaryStats, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });
}

export function useEvents(filters: EventFilters = {}) {
  const key = ["events", filters];
  return useSWR(key, () => getEvents(filters), {
    refreshInterval: 15000, // Refresh every 15 seconds
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });
}

export function useHealth() {
  return useSWR("health", getHealth, {
    refreshInterval: 60000, // Check health every minute
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
}
