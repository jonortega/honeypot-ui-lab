import { readFileSync } from "fs";
import { resolve } from "path";

export function loadHostKey(hostKeyPathFromEnv: string): Buffer {
  const keyPath = resolve(process.cwd(), hostKeyPathFromEnv);
  try {
    return readFileSync(keyPath);
  } catch {
    console.error(`[hp/ssh] No se pudo leer la clave de host en ${keyPath}.
Genera una con:
  ssh-keygen -t rsa -b 2048 -m PEM -f ${hostKeyPathFromEnv} -N "" 
y vuelve a ejecutar.`);
    process.exit(1);
  }
}
