const API_BASE_URL = process.env.API_BASE_URL;
const API_TOKEN = process.env.HNY_ADMIN_TOKEN;

if (!API_BASE_URL) {
  throw new Error("BASE_API_URL is not set for dashboard server runtime");
}
if (!API_TOKEN) {
  // Si tu /health no requiere auth, esto explica por qué health=200 y otros=500
  console.warn("[upstream] HNY_ADMIN_TOKEN is empty. Summary/Events will fail (401).");
}

export function upstreamUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function fetchUpstream(path: string, init?: RequestInit) {
  const headers = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };

  return fetch(upstreamUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });
}
