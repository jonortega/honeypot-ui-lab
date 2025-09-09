// apps/dashboard/lib/upstream.ts
function readApiBaseUrl(): string {
  return process.env.API_BASE_URL || "";
}

function readAuthToken(): string {
  return process.env.AUTH_TOKEN || "";
}

export function upstreamUrl(path: string): string {
  const base = readApiBaseUrl();
  if (!base) {
    // Importante: fallar SOLO cuando realmente se intenta usar upstream
    throw new Error("Missing API_BASE_URL at runtime");
  }
  return `${base}${path}`;
}

export async function fetchUpstream(path: string, init?: RequestInit) {
  const token = readAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(upstreamUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}
