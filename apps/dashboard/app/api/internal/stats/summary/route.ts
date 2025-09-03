import { NextResponse } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import { normalizeSummary } from "@/lib/adapters/summary";
import type { SummaryStats } from "@/lib/types";

export async function GET() {
  try {
    const res = await fetchUpstream("/api/stats/summary");
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[stats/summary] Upstream not ok:", res.status, text);
      return NextResponse.json(
        { error: "Upstream error", upstreamStatus: res.status, details: text.slice(0, 500) },
        { status: res.status } // ← devuelve el código real (401/403/404/5xx)
      );
    }
    const raw = await res.json();
    const normalized: SummaryStats = normalizeSummary(raw);
    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error("[stats/summary] Fetch failed:", err?.message);
    return NextResponse.json({ error: "Fetch failed", details: err?.message }, { status: 500 });
  }
}
