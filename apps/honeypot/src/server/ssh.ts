import { createRequire } from "module";
import type { Connection, AuthContext, AuthenticationType } from "ssh2";
import { getConfig } from "../config.js";
import { loadHostKey } from "./ssh/key.js";
import { srcIp, srcPort } from "./ssh/net.js";
import { logSsh } from "./ssh/utils.js";
import { recordSsh } from "./ssh/recorder.js";

// Cargar módulo CommonJS desde ESM
const cjsRequire = createRequire(import.meta.url);
const { Server } = cjsRequire("ssh2");

export function startSSHServer() {
  const { HNY_SSH_PORT, HNY_HOST_KEY_PATH } = getConfig();
  const hostKey = loadHostKey(HNY_HOST_KEY_PATH);

  const server = new Server({ hostKeys: [hostKey] }, (client: Connection) => {
    const ip = srcIp(client);
    const port = srcPort(client);
    logSsh(`Cliente conectado desde ${ip}:${port}`);

    client.on("authentication", (ctx: AuthContext) => {
      logSsh(`Intento de login user=${ctx.username} from ${ip}:${port}`);

      // Solo aceptamos/forzamos 'password'
      const onlyPassword = ["password"] as const;
      if (ctx.method !== "password") {
        ctx.reject(onlyPassword as unknown as AuthenticationType[]);
        return;
      }

      // Registrar evento y rechazar
      recordSsh(client, ctx);
      ctx.reject();
    });

    client.on("end", () => {});
  });

  server.listen(HNY_SSH_PORT, "0.0.0.0", () => {
    logSsh(`SSH honeypot escuchando en puerto ${HNY_SSH_PORT}`);
  });
}
