"use client";

import { useState, useEffect } from "react";
import { useStats, useEvents, useHealth } from "@/hooks/use-api";
import { cn, isLikelyIP, rangeToFromTo } from "@/lib/utils";
import type { EventFilters, EventItem } from "@/lib/types";
import { RecentEventsTable } from "./recent-events-table";
import { StatsOverview } from "./stats-overview";

interface OverviewPageProps {
  className?: string;
}

export function OverviewPage({ className }: OverviewPageProps) {
  // Filtros server-driven
  const [filters, setFilters] = useState<EventFilters>({
    limit: 50,
    offset: 0,
    // service?: "ssh" | "http"
    // ip?: string
    // from?: string
    // to?: string
  });

  // UI-only (cliente)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | "ssh" | "http">("all");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "custom">("24h");

  // Hooks de datos (PADRE)
  const { data: stats, mutate: refreshStats } = useStats();
  const { data: health, mutate: refreshHealth } = useHealth();
  const {
    data: eventsData,
    error: eventsError,
    isLoading,
    mutate: refreshEvents,
  } = useEvents({
    ...filters,
    service: serviceFilter === "all" ? undefined : serviceFilter,
    // si el término parece IP, lo pasas; si no, lo dejas undefined y filtras en cliente
    ip: isLikelyIP(searchTerm) ? searchTerm.trim() : undefined,
    // from/to calculados a partir de timeRange (como ya hacías)
    ...rangeToFromTo(timeRange),
  });

  const handleRefresh = () => {
    refreshStats();
    refreshEvents();
    refreshHealth();
  };

  return (
    <>
      {/* header con botón que llama handleRefresh */}
      {/* KPIs que usan `stats` */}
      <RecentEventsTable
        // datos
        eventsData={eventsData}
        isLoading={isLoading}
        error={eventsError}
        // server filters
        filters={filters}
        setFilters={setFilters}
        // ui filters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />
    </>
  );
}
