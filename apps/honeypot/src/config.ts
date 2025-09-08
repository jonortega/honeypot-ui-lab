import * as dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";

function inDocker(): boolean {
  // Señal explícita en compose o heurística simple
  return process.env.HNY_RUNTIME === "docker" || existsSync("/.dockerenv");
}

// 1) Cargar .env local SOLO si existe y solo en dev (y sin override)
const envFile =
  process.env.HNY_ENV_FILE ?? // opcional: permite apuntar a otro nombre si quieres
  ".env.local";

const envPath = resolve(process.cwd(), envFile);
if (process.env.NODE_ENV !== "production" && existsSync(envPath)) {
  // No uses override:true -> no pisa variables que ya vinieron de Docker
  dotenv.config({ path: envPath });
}

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
    HNY_DB_PATH,
    HNY_HOST_KEY_PATH,
    HNY_ADMIN_TOKEN,
  } = process.env;

  const services = parseServices(HNY_SERVICE);

  // 2) Defaults coherentes por entorno SOLO si no llegan por env
  const defaultDbPath = inDocker() ? "/data/events.db" : "../../data/events.db";
  const defaultHostKey = inDocker() ? "/app/host.key" : "./apps/honeypot/host.key";

  const sshPort = parsePort(HNY_SSH_PORT ?? (services.includes("ssh") ? HNY_PORT : undefined), 2222);
  const httpPort = parsePort(HNY_HTTP_PORT ?? (services.includes("http") ? HNY_PORT : undefined), 8080);

  cached = {
    HNY_SERVICE: services[0],
    HNY_SERVICES: services,
    HNY_SSH_PORT: sshPort,
    HNY_HTTP_PORT: httpPort,
    HNY_DB_PATH: HNY_DB_PATH || defaultDbPath,
    HNY_HOST_KEY_PATH: HNY_HOST_KEY_PATH || defaultHostKey,
    HNY_ADMIN_TOKEN,
  };
  return cached;
}
