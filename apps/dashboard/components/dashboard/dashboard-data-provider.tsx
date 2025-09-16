"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useEvents, useHealth, useStats } from "@/hooks/use-api";
import type { EventFilters } from "@/lib/types";

type ServiceFilter = "all" | "ssh" | "http";
type StatusFilter = "all" | "success" | "failed";
type TimeRange = "24h" | "7d" | "custom";

type DashboardDataContextValue = {
  // Datos
  stats: any;
  health: any;
  eventsData:
    | {
        items: any[];
        total: number;
        limit: number;
        offset: number;
      }
    | undefined;
  isEventsLoading: boolean;
  eventsError: Error | undefined;
  statsError: Error | undefined;
  healthError: Error | undefined;

  // Filtros server-driven
  filters: EventFilters;
  setFilters: React.Dispatch<React.SetStateAction<EventFilters>>;

  // Filtros/UI
  searchTerm: string;
  setSearchTerm: (v: string) => void;

  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;

  serviceFilter: ServiceFilter;
  setServiceFilter: (v: ServiceFilter) => void;

  timeRange: TimeRange;
  setTimeRange: (v: TimeRange) => void;

  // Acciones
  refreshAll: () => void;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
  return ctx;
}

const isLikelyIP = (term: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(term.trim()) || /^[0-9a-f:]+$/i.test(term.trim());

function rangeToFromTo(range: TimeRange): { from?: string; to?: string } {
  const now = new Date();
  if (range === "24h") {
    const d = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  if (range === "7d") {
    const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: d.toISOString(), to: now.toISOString() };
  }
  return {};
}

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  // Filtros server-driven (paginación y base)
  const [filters, setFilters] = useState<EventFilters>({ limit: 50, offset: 0 });

  // Filtros/UI (cliente)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  // Hooks de datos
  const { data: stats, mutate: refreshStats, error: statsError } = useStats();
  const { data: health, mutate: refreshHealth, error: healthError } = useHealth();

  // Combinamos filtros para useEvents:
  const eventsQuery = useMemo(() => {
    const base: EventFilters = {
      ...filters,
      service: serviceFilter === "all" ? undefined : serviceFilter,
      ...rangeToFromTo(timeRange),
    };
    const ip = isLikelyIP(searchTerm) ? searchTerm.trim() : undefined;
    return ip ? { ...base, ip } : base;
  }, [filters, serviceFilter, timeRange, searchTerm]);

  const {
    data: eventsData,
    isLoading: isEventsLoading,
    error: eventsError,
    mutate: refreshEvents,
  } = useEvents(eventsQuery);

  // Auto-refresh: health (15s)
  useEffect(() => {
    const id = setInterval(() => refreshHealth(), 15000);
    return () => clearInterval(id);
  }, [refreshHealth]);

  // Auto-refresh: stats + events (5s)
  useEffect(() => {
    const id = setInterval(() => {
      refreshStats();
      refreshEvents();
    }, 5000);
    return () => clearInterval(id);
  }, [refreshStats, refreshEvents]);

  const refreshAll = () => {
    refreshStats();
    refreshEvents();
    refreshHealth();
  };

  const value: DashboardDataContextValue = {
    stats,
    health,
    eventsData,
    isEventsLoading,
    eventsError,
    statsError,
    healthError,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    timeRange,
    setTimeRange,
    refreshAll,
  };

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}
