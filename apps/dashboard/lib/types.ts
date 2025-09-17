export interface SummaryStats {
  totalEvents: number;
  byDay: Array<{
    date: string;
    count: number;
  }>;
  topIPs: Array<{
    ip: string;
    count: number;
  }>;
  topUsernames: Array<{
    username: string;
    count: number;
  }>;
  topPaths: Array<{
    path: string;
    count: number;
  }>;
}

export type ServiceType = "ssh" | "http";

export interface EventItem {
  id: number;
  ts_utc: string; // ISO 8601
  src_ip: string;
  src_port: number | null;
  service: ServiceType;
  username?: string | null;
  password?: string | null;
  http_method?: string | null;
  http_path?: string | null;
  http_status?: number | null;
  user_agent?: string | null;
  raw?: unknown | null; // parseado si es JSON válido; si no, string/null
}

export interface EventsResponse {
  total: number;
  limit: number;
  offset: number;
  items: EventItem[];
}

export interface HealthResponse {
  ok: boolean;
  message?: string;
}

export interface EventFilters {
  service?: "ssh" | "http" | "all";
  ip?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export type ServiceFilter = "all" | "ssh" | "http";
export type StatusFilter = "all" | "success" | "failed";
export type TimeRange = "24h" | "7d" | "all";

export type PropsEventsTable = {
  /** Datos traídos por el padre con useEvents(filters) */
  eventsData:
    | {
        items: EventItem[];
        total: number;
        limit: number;
        offset: number;
      }
    | undefined;
  isLoading: boolean;
  error: unknown;

  /** Filtros server-driven y su setter (para paginación principalmente) */
  filters: EventFilters;
  setFilters: React.Dispatch<React.SetStateAction<EventFilters>>;

  /** Filtros/UI state controlados por el padre */
  searchTerm: string;
  setSearchTerm: (v: string) => void;

  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;

  serviceFilter: ServiceFilter;
  setServiceFilter: (v: ServiceFilter) => void;

  timeRange: TimeRange;
  setTimeRange: (v: TimeRange) => void;
};
