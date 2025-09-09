import { NextResponse } from "next/server";
import { fetchUpstream } from "@/lib/upstream";
import type { HealthResponse } from "@/lib/types";

export async function GET() {
  try {
    const res = await fetchUpstream("/health");

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Health check failed", upstreamStatus: res.status, details: text.slice(0, 500) },
        { status: res.status }
      );
    }

    const data: HealthResponse = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[health] Error:", error?.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
