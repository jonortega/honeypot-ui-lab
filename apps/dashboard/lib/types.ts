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
  service?: "ssh" | "http";
  ip?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
