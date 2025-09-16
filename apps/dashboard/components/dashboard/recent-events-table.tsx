"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEvents } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { EventFilters, EventItem } from "@/lib/types";

/**
 * Helpers
 */
const isLikelyIP = (term: string) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(term.trim()) || /^[0-9a-f:]+$/i.test(term.trim()); // ipv4 or ipv6 (very loose)

type ServiceFilter = "all" | "ssh" | "http";
type StatusFilter = "all" | "success" | "failed";
type TimeRange = "24h" | "7d" | "custom";

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
  // "custom": no cambiamos filtros de fecha aquí (podrás añadir datepicker luego)
  return {};
}

function statusIsSuccess(http_status?: number | null): boolean | undefined {
  if (typeof http_status !== "number") return undefined;
  return http_status >= 100 && http_status < 400;
}

export function RecentEventsTable() {
  // --- Server-driven filters (se reflejan en la llamada a useEvents) ---
  const [filters, setFilters] = useState<EventFilters>({
    limit: 50,
    offset: 0,
    // service?: "ssh" | "http"
    // ip?: string
    // from?: string
    // to?: string
  });

  // --- UI state (se mezclan con filtros o se aplican en cliente) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  // Sincroniza serviceFilter -> filters.service (server)
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      service: serviceFilter === "all" ? undefined : serviceFilter,
      offset: 0,
    }));
  }, [serviceFilter]);

  // Sincroniza timeRange -> filters.from/to (server)
  useEffect(() => {
    const { from, to } = rangeToFromTo(timeRange);
    setFilters((prev) => ({
      ...prev,
      from,
      to,
      offset: 0,
    }));
  }, [timeRange]);

  // Search:
  // - Si parece IP, lo mandamos al server como filters.ip para que haga la query allí.
  // - Si no parece IP, hacemos filtrado en cliente (por username/path).
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      ip: isLikelyIP(searchTerm) ? searchTerm.trim() : undefined,
      offset: 0,
    }));
  }, [searchTerm]);

  const { data: eventsData, isLoading, error } = useEvents(filters);

  const events = eventsData?.items ?? [];
  const total = eventsData?.total ?? 0;
  const limit = eventsData?.limit ?? filters.limit ?? 50;
  const offset = eventsData?.offset ?? filters.offset ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  // Filtrado en cliente para:
  // - statusFilter (success/failed sobre http_status)
  // - searchTerm cuando NO es IP (busca en username y http_path)
  const filteredEvents = useMemo(() => {
    let out = events.slice();

    // Filtro por "success/failed" SOLO para eventos HTTP que tengan http_status
    if (statusFilter !== "all") {
      out = out.filter((e) => {
        const s = statusIsSuccess(e.http_status);
        if (s === undefined) {
          // Eventos SSH o HTTP sin status -> no entran ni en success ni en failed
          return false;
        }
        return statusFilter === "success" ? s === true : s === false;
      });
    }

    // Filtro por término de búsqueda cuando NO es IP (cliente)
    if (searchTerm && !isLikelyIP(searchTerm)) {
      const term = searchTerm.toLowerCase();
      out = out.filter((e) => {
        const inUser = e.username?.toLowerCase().includes(term) ?? false;
        const inPath = e.http_path?.toLowerCase().includes(term) ?? false;
        const inIP = e.src_ip?.toLowerCase().includes(term) ?? false;
        return inUser || inPath || inIP;
      });
    }

    return out;
  }, [events, statusFilter, searchTerm]);

  const handlePageChange = (newOffset: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, newOffset),
    }));
  };

  // Skeleton de carga
  // if (isLoading) {
  //   return (
  //     <Card className='animate-pulse'>
  //       <CardHeader>
  //         <div className='h-6 bg-muted rounded w-1/4' />
  //       </CardHeader>
  //       <CardContent>
  //         <div className='space-y-4'>
  //           {Array.from({ length: 6 }).map((_, i) => (
  //             <div key={i} className='h-12 bg-muted rounded' />
  //           ))}
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  // Error
  // if (error) {
  //   return (
  //     <Card className='border-destructive'>
  //       <CardHeader>
  //         <CardTitle>Recent Events</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <p className='text-destructive'>Failed to load events</p>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Events</CardTitle>

          {/* Filtros (Search, Service, Status, Time Range, Export) */}
          <div className='flex items-center space-x-2'>
            {/* Search */}
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search events...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 w-64'
              />
            </div>

            {/* Service */}
            <select
              className={cn(
                "h-9 rounded-md border bg-background px-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-accent/40"
              )}
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
            >
              <option value='all'>All Services</option>
              <option value='ssh'>SSH</option>
              <option value='http'>HTTP</option>
            </select>

            {/* Status */}
            <select
              className={cn(
                "h-9 rounded-md border bg-background px-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-accent/40"
              )}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value='all'>All Status</option>
              <option value='success'>Success (HTTP &lt; 400)</option>
              <option value='failed'>Failed (HTTP ≥ 400)</option>
            </select>

            {/* Time range */}
            <select
              className={cn(
                "h-9 rounded-md border bg-background px-3 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-accent/40"
              )}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            >
              <option value='24h'>Last 24h</option>
              <option value='7d'>Last 7 days</option>
              <option value='custom'>Custom</option>
            </select>

            {/* Export (placeholder) */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                /* TODO: wire export later */
              }}
            >
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Timestamp</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Service</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Source IP</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Path</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Username</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Password</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event: EventItem) => {
                const httpStatusText = typeof event.http_status === "number" ? String(event.http_status) : "—";
                const ok = statusIsSuccess(event.http_status);

                return (
                  <tr key={event.id} className='border-b border-border hover:bg-muted/50'>
                    <td className='py-3 px-4 text-sm font-mono'>{formatDate(event.ts_utc)}</td>

                    <td className='py-3 px-4'>
                      <Badge
                        variant='outline'
                        className={cn(
                          "font-mono",
                          event.service === "ssh" ? "border-chart-2 text-chart-2" : "border-chart-3 text-chart-3"
                        )}
                      >
                        {event.service.toUpperCase()}
                      </Badge>
                    </td>

                    <td className='py-3 px-4 font-mono text-sm'>{event.src_ip}</td>
                    <td className='py-3 px-4 font-mono text-sm'>{event.http_path || "—"}</td>
                    <td className='py-3 px-4 text-sm'>{event.username || "—"}</td>
                    <td className='py-3 px-4 text-sm'>{event.password || "—"}</td>

                    <td className='py-3 px-4'>
                      {ok === undefined ? (
                        <Badge variant='outline' className='opacity-60'>
                          —
                        </Badge>
                      ) : ok ? (
                        <Badge variant='default'>Success</Badge>
                      ) : (
                        <Badge variant='destructive'>Failed</Badge>
                      )}
                      {ok !== undefined && (
                        <span className='ml-2 text-xs text-muted-foreground align-middle'>{httpStatusText}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className='text-center py-8 text-muted-foreground'>No events found matching your filters.</div>
        )}

        {/* Paginación server-driven */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between mt-6'>
            <p className='text-sm text-muted-foreground'>
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} events
            </p>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(offset - limit)}
                disabled={offset === 0}
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                Previous
              </Button>
              <span className='text-sm text-muted-foreground'>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
                <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
