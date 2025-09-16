"use client";

import { RecentEventsTable } from "@/components/dashboard/recent-events-table";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { useDashboardData } from "@/components/dashboard/dashboard-data-provider";

export function OverviewPage() {
  const {
    // datos
    eventsData,
    isEventsLoading,
    eventsError,
    // filtros server
    filters,
    setFilters,
    // filtros UI
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    serviceFilter,
    setServiceFilter,
    timeRange,
    setTimeRange,
  } = useDashboardData();

  return (
    <div className='space-y-6'>
      <StatsOverview />
      <RecentEventsTable
        eventsData={eventsData}
        isLoading={isEventsLoading}
        error={eventsError}
        filters={filters}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />
    </div>
  );
}
