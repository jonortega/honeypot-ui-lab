import type { Connection, AuthContext } from "ssh2";
import { handleEvent } from "../../collector/collector.js";
import { srcIp, srcPort } from "./net.js";

export function recordSsh(client: Connection, ctx: AuthContext) {
  handleEvent({
    ts_utc: new Date().toISOString(),
    src_ip: srcIp(client),
    src_port: srcPort(client),
    service: "ssh",
    username: ctx.username,
    // si quieres almacenar en claro, mantenlo:
    password: "password" in ctx ? (ctx as any).password : undefined,
    raw: JSON.stringify({ method: ctx.method }),
  });
}
