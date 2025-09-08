import { createRequire } from "module";
import { readFileSync } from "fs";
import { resolve } from "path";
import { handleEvent } from "../collector/collector.js";
import { getConfig } from "../config.js";
import type { Connection, AuthContext, AuthenticationType } from "ssh2";

// Cargar módulo CommonJS desde ESM
const cjsRequire = createRequire(import.meta.url);
const { Server } = cjsRequire("ssh2");

export function startSSHServer() {
  const { HNY_SSH_PORT, HNY_HOST_KEY_PATH } = getConfig();

  const keyPath = resolve(process.cwd(), HNY_HOST_KEY_PATH);
  let hostKey: Buffer;
  try {
    hostKey = readFileSync(keyPath);
  } catch (e) {
    console.error(`[hp/ssh] No se pudo leer la clave de host en ${keyPath}.
Genera una con:
  ssh-keygen -t rsa -b 2048 -m PEM -f ${HNY_HOST_KEY_PATH} -N "" 
y vuelve a ejecutar.`);
    process.exit(1);
  }

  const server = new Server({ hostKeys: [hostKey] }, (client: Connection) => {
    const srcIp = (client as any)._sock?.remoteAddress;
    const srcPort = (client as any)._sock?.remotePort;

    console.log(`[hp/ssh] Cliente conectado desde ${srcIp}:${srcPort}`);

    client.on("authentication", (ctx: AuthContext) => {
      console.log(`[hp/ssh] Intento de login user=${ctx.username} from ${srcIp}:${srcPort}`);

      // Anuncia que solo aceptas 'password'
      const onlyPassword = ["password"] as const;

      if (ctx.method !== "password") {
        ctx.reject(onlyPassword as unknown as AuthenticationType[]);
        return;
      }

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

  server.listen(HNY_SSH_PORT, "0.0.0.0", () => {
    console.log(`[hp/ssh] SSH honeypot escuchando en puerto ${HNY_SSH_PORT}`);
  });
}
