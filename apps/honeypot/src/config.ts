import * as dotenv from "dotenv";

dotenv.config();

type ServiceType = "ssh" | "http";

interface Config {
  HNY_SERVICE: ServiceType;
  HNY_PORT: number;
  HNY_DB_PATH: string;
  HNY_ADMIN_TOKEN?: string;
}

let cached: Config | null = null;

export function getConfig(): Config {
  if (cached) return cached;

  const { HNY_SERVICE = "ssh", HNY_PORT = "22", HNY_DB_PATH = "../../data/honeypot.db", HNY_ADMIN_TOKEN } = process.env;

  if (HNY_SERVICE !== "ssh" && HNY_SERVICE !== "http") {
    throw new Error(`HNY_SERVICE debe ser "ssh" o "http", recibido: ${HNY_SERVICE}`);
  }

  const port = parseInt(HNY_PORT, 10);
  if (Number.isNaN(port)) {
    throw new Error(`HNY_PORT debe ser un número válido, recibido: ${HNY_PORT}`);
  }

  cached = {
    HNY_SERVICE,
    HNY_PORT: port,
    HNY_DB_PATH,
    HNY_ADMIN_TOKEN,
  };

  return cached;
}
