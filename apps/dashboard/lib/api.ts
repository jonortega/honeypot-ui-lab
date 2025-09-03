import type { SummaryStats, EventsResponse, HealthResponse, EventFilters } from "./types";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(endpoint, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function getSummaryStats(): Promise<SummaryStats> {
  return apiRequest<SummaryStats>("/api/internal/stats/summary");
}

export async function getEvents(filters: EventFilters = {}): Promise<EventsResponse> {
  const params = new URLSearchParams();

  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.offset) params.append("offset", filters.offset.toString());
  if (filters.service) params.append("service", filters.service);
  if (filters.ip) params.append("ip", filters.ip);
  if (filters.from) params.append("from", filters.from);
  if (filters.to) params.append("to", filters.to);

  const query = params.toString();
  const endpoint = `/api/internal/events${query ? `?${query}` : ""}`;

  return apiRequest<EventsResponse>(endpoint);
}

export async function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/api/internal/health");
}
