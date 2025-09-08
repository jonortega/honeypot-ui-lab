import type { Connection } from "ssh2";

export function srcIp(client: Connection): string {
  // ssh2 no expone tipos públicos para _sock; usamos any con precaución
  return (client as any)._sock?.remoteAddress || "unknown";
}

export function srcPort(client: Connection): number | undefined {
  const p = (client as any)._sock?.remotePort;
  return typeof p === "number" ? p : undefined;
}
