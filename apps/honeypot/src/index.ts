import { startSSHServer } from "./server/ssh.js";
import { startHTTPServer } from "./server/http.js";
import { getConfig } from "./config.js";

const services: Record<string, () => void> = {
  ssh: startSSHServer,
  http: startHTTPServer,
};

const { HNY_SERVICE } = getConfig();

const starter = services[HNY_SERVICE];
if (starter) {
  starter();
} else {
  console.error(`[hp] Servicio no soportado: ${HNY_SERVICE}`);
  process.exit(1);
}
