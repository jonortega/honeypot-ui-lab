export function clamp(s: string | undefined, max = 1024) {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) : s;
}

export function logHttp(line: string) {
  // Punto único para logs HTTP (por si luego rotas o formateas)
  // eslint-disable-next-line no-console
  console.log(`[hp/http] ${line}`);
}
