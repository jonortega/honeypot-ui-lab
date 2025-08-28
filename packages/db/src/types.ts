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
