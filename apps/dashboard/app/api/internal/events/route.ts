import { NextResponse } from "next/server";
import { fetchUpstream, upstreamUrl } from "@/lib/upstream";
import { normalizeEventsResponse } from "@/lib/adapters/events";
import type { EventsResponse } from "@/lib/types";

function allowedSearchParams(url: URL) {
  // Solo permitimos estos parámetros hacia upstream
  const allow = new Set(["limit", "offset", "service", "ip", "from", "to"]);
  const out = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (allow.has(key) && value !== "") out.set(key, value);
  });
  return out;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qs = allowedSearchParams(url);
    const path = qs.toString() ? `/api/events?${qs.toString()}` : "/api/events";

    // Usa el wrapper común (añade headers y cache no-store)
    const res = await fetchUpstream(path);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[events] Upstream not ok:", res.status, text);
      return NextResponse.json(
        { error: "Upstream error", upstreamStatus: res.status, details: text.slice(0, 500) },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const normalized: EventsResponse = normalizeEventsResponse(raw);
    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error("[events] Fetch failed:", err?.message);
    return NextResponse.json({ error: "Fetch failed", details: err?.message }, { status: 500 });
  }
}
