// apps/honeypot/src/index.ts
import { startSSHServer } from "./server/ssh.js";
import { startHTTPServer } from "./server/http.js";
import { getConfig } from "./config.js";
import { bootstrap } from "db";

const services: Record<string, () => void> = {
  ssh: startSSHServer,
  http: startHTTPServer,
};

const { HNY_SERVICES, HNY_DB_PATH } = getConfig();

bootstrap(HNY_DB_PATH);

for (const svc of HNY_SERVICES) {
  const starter = services[svc];
  if (!starter) {
    console.error(`[hp] Servicio no soportado: ${svc}`);
    process.exit(1);
  }
  console.log(`[hp] Iniciando servicio: ${svc}`);
  starter();
}
