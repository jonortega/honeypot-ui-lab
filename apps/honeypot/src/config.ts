import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

type ServiceType = "ssh" | "http";

interface Config {
  HNY_SERVICE: ServiceType; // compatibilidad
  HNY_SERVICES: ServiceType[]; // lista de servicios
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

function parseServices(raw: string | undefined): ServiceType[] {
  const ok: ServiceType[] = [];
  const seen = new Set<string>();
  const items = (raw ?? "ssh").split(",").map((s) => s.trim().toLowerCase());
  for (const it of items) {
    if ((it === "ssh" || it === "http") && !seen.has(it)) {
      ok.push(it);
      seen.add(it);
    }
  }
  if (ok.length === 0) {
    throw new Error(`HNY_SERVICE inválido. Usa "ssh", "http" o "ssh,http". Recibido: ${raw}`);
  }
  return ok;
}

export function getConfig(): Config {
  if (cached) return cached;

  const {
    HNY_SERVICE,
    HNY_PORT, // fallback legacy
    HNY_SSH_PORT,
    HNY_HTTP_PORT,
    HNY_DB_PATH = "../../data/events.db",
    HNY_HOST_KEY_PATH = "./apps/honeypot/host.key",
    HNY_ADMIN_TOKEN,
  } = process.env;

  const services = parseServices(HNY_SERVICE);
  const sshPort = parsePort(HNY_SSH_PORT ?? (services.includes("ssh") ? HNY_PORT : undefined), 2222);
  const httpPort = parsePort(HNY_HTTP_PORT ?? (services.includes("http") ? HNY_PORT : undefined), 8080);

  cached = {
    HNY_SERVICE: services[0],
    HNY_SERVICES: services,
    HNY_SSH_PORT: sshPort,
    HNY_HTTP_PORT: httpPort,
    HNY_DB_PATH,
    HNY_HOST_KEY_PATH,
    HNY_ADMIN_TOKEN,
  };
  return cached;
}
