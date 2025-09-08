import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

type ServiceType = "ssh" | "http";

interface Config {
  HNY_SERVICE: ServiceType;
  HNY_SSH_PORT: number;
  HNY_HTTP_PORT: number;
  HNY_DB_PATH: string;
  HNY_HOST_KEY_PATH: string;
  HNY_ADMIN_TOKEN?: string;
}

let cached: Config | null = null;

function parsePort(val: string | undefined, def: number): number {
  const n = val ? parseInt(val, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

export function getConfig(): Config {
  if (cached) return cached;

  const {
    HNY_SERVICE = "ssh",
    HNY_PORT, // fallback legacy (opcional)
    HNY_SSH_PORT,
    HNY_HTTP_PORT,
    HNY_DB_PATH = "../../data/events.db",
    HNY_HOST_KEY_PATH = "./apps/honeypot/host.key",
    HNY_ADMIN_TOKEN,
  } = process.env;

  if (HNY_SERVICE !== "ssh" && HNY_SERVICE !== "http") {
    throw new Error(`HNY_SERVICE debe ser "ssh" o "http", recibido: ${HNY_SERVICE}`);
  }

  // Fallbacks:
  // - Si no hay HNY_SSH_PORT, usamos HNY_PORT (si el servicio activo es ssh) o 2222.
  // - Si no hay HNY_HTTP_PORT, usamos HNY_PORT (si el servicio activo es http) o 8080.
  const sshPort = parsePort(HNY_SSH_PORT ?? (HNY_SERVICE === "ssh" ? HNY_PORT : undefined), 2222);
  const httpPort = parsePort(HNY_HTTP_PORT ?? (HNY_SERVICE === "http" ? HNY_PORT : undefined), 8080);

  cached = {
    HNY_SERVICE,
    HNY_SSH_PORT: sshPort,
    HNY_HTTP_PORT: httpPort,
    HNY_DB_PATH,
    HNY_HOST_KEY_PATH,
    HNY_ADMIN_TOKEN,
  };

  return cached;
}
