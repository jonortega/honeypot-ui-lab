"use client";

import useSWR from "swr";
import { getEvents } from "@/lib/api";
import type { EventsResponse } from "@/lib/types";

export type EventsParams = Partial<{
  limit: number;
  offset: number;
  service: "ssh" | "http";
  ip: string;
  from: string; // ISO
  to: string; // ISO
  refreshInterval: number; // ms
  revalidateOnFocus: boolean;
}>;

function keyFromParams(p?: EventsParams) {
  const sp = new URLSearchParams();
  if (p?.limit != null) sp.set("limit", String(p.limit));
  if (p?.offset != null) sp.set("offset", String(p.offset));
  if (p?.service) sp.set("service", p.service);
  if (p?.ip) sp.set("ip", p.ip);
  if (p?.from) sp.set("from", p.from);
  if (p?.to) sp.set("to", p.to);
  const qs = sp.toString();
  return `/api/internal/events${qs ? `?${qs}` : ""}`;
}

export function useHoneypotEvents(params?: EventsParams) {
  const key = keyFromParams(params);
  const refreshInterval = params?.refreshInterval ?? 10_000;
  const revalidateOnFocus = params?.revalidateOnFocus ?? false;

  const { data, error, isLoading, mutate } = useSWR<EventsResponse>(
    key,
    () =>
      getEvents({
        limit: params?.limit,
        offset: params?.offset,
        service: params?.service,
        ip: params?.ip,
        from: params?.from,
        to: params?.to,
      }),
    { refreshInterval, revalidateOnFocus, dedupingInterval: 5_000 }
  );

  return { events: data, error, isLoading, refresh: mutate };
}
