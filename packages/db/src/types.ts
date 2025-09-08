export type EventInsert = {
  ts_utc: string;
  src_ip: string;
  src_port?: number;
  service: "ssh" | "http";
  // Campos SSH
  username?: string;
  password?: string;
  // Campos HTTP
  http_method?: string;
  http_path?: string;
  http_status?: number;
  user_agent?: string;
  // Extra
  raw?: string; // JSON string opcional
};

export interface EventRow {
  id: number;
  ts_utc: string; // ISO 8601
  src_ip: string;
  src_port: number | null;
  service: "ssh" | "http";
  username?: string | null;
  password?: string | null;
  http_method?: string | null;
  http_path?: string | null;
  http_status?: number | null;
  user_agent?: string | null;
  raw?: string | null; // JSON en string
}

export type StatsTopItem = Readonly<{ value: string; count: number }>;
export type StatsByDayItem = Readonly<{ date: string; count: number }>;
export type StatsSummary = Readonly<{
  totalEvents: number;
  byDay: ReadonlyArray<StatsByDayItem>;
  topIPs: ReadonlyArray<StatsTopItem>;
  topUsernames: ReadonlyArray<StatsTopItem>;
  topPaths: ReadonlyArray<StatsTopItem>;
}>;
