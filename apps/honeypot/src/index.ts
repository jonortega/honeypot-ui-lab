// apps/honeypot/src/index.ts
import { startSSHServer } from "./server/ssh.js";
import { startHTTPServer } from "./server/http.js";
import { getConfig } from "./config.js";

const services: Record<string, () => void> = {
  ssh: startSSHServer,
  http: startHTTPServer,
};

const { HNY_SERVICES } = getConfig();

for (const svc of HNY_SERVICES) {
  const starter = services[svc];
  if (!starter) {
    console.error(`[hp] Servicio no soportado: ${svc}`);
    process.exit(1);
  }
  console.log(`[hp] Iniciando servicio: ${svc}`);
  starter();
}
