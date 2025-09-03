import { createRequire } from "module";
import { readFileSync } from "fs";
import { handleEvent } from "../collector/collector.js";
import { getConfig } from "../config.js";
import type { Connection, AuthContext } from "ssh2";

// Cargar módulo CommonJS desde ESM
const cjsRequire = createRequire(import.meta.url);
const { Server } = cjsRequire("ssh2");

export function startSSHServer() {
  const { HNY_PORT } = getConfig();

  const server = new Server({ hostKeys: [cjsRequire("fs").readFileSync("host.key")] }, (client: Connection) => {
    const srcIp = (client as any)._sock?.remoteAddress;
    const srcPort = (client as any)._sock?.remotePort;

    client.on("authentication", (ctx: AuthContext) => {
      console.log(`[hp/ssh] Intento de login user=${ctx.username} from ${srcIp}:${srcPort}`);
      // Crear evento y pasarlo al collector
      handleEvent({
        ts_utc: new Date().toISOString(),
        src_ip: srcIp || "unknown",
        src_port: srcPort,
        service: "ssh",
        username: ctx.username,
        password: "password" in ctx ? ctx.password : undefined,
        raw: JSON.stringify({ method: ctx.method }),
      });
      // Siempre rechazar
      ctx.reject();
    });

    client.on("end", () => {});
  });

  server.listen(HNY_PORT, "0.0.0.0", () => {
    console.log(`SSH honeypot escuchando en puerto ${HNY_PORT}`);
  });
}
