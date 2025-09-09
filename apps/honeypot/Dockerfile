# ---- build deps & compile (monorepo + pnpm workspaces) ----
FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

# Necesario para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

# Copiamos lo mínimo para resolver deps en caché
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/honeypot/package.json apps/honeypot/
COPY packages/db/package.json packages/db/
# Si añades más workspaces en el futuro, copia sus package.json aquí

# Pre-resuelve deps de prod de honeypot + db (mejor caché)
RUN pnpm fetch --prod --filter ./packages/db... --filter ./apps/honeypot...

# Ahora sí, el repo completo (respetará .dockerignore)
COPY . .

# Build TS → JS (db y honeypot)
RUN pnpm -r --filter ./packages/db... --filter ./apps/honeypot... build

# Empaqueta SOLO lo necesario para prod de honeypot (+ node_modules ya compilados)
RUN pnpm deploy --filter ./apps/honeypot --prod --legacy /out

# ---- runtime (ligero) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiamos el paquete “deployado”
COPY --from=builder /out ./

# Clave de host (si la versionas). Alternativa recomendada: montarla como secret/volume.
COPY apps/honeypot/host.key /app/host.key
# Propietario y permisos: el proceso corre como 'node' y debe poder leerla
RUN chown node:node /app/host.key && chmod 600 /app/host.key

# su-exec para hacer drop a usuario 'node' y curl para healthcheck
RUN apk add --no-cache su-exec
RUN apk add --no-cache curl

# EntryPoint que fija permisos del volumen y ejecuta como 'node'
COPY apps/honeypot/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# NO usamos USER aquí; el entrypoint se encarga de cambiar a 'node'
EXPOSE 2222 8080

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
