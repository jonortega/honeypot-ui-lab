import { NextResponse } from "next/server";
import type { HealthResponse } from "@/lib/types";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const API_TOKEN = process.env.API_TOKEN || "testtoken123";

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Health check failed" }, { status: response.status });
    }

    const data: HealthResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking health:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
