# ---- build deps & compile (monorepo + pnpm workspaces) ----
FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

# Necesario para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

# Copiamos lo mínimo para cachear deps por workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
# Si añades más workspaces, copia sus package.json aquí

# Pre-resuelve deps de db + api (mejor caché)
RUN pnpm fetch --filter ./packages/db... --filter ./apps/api...

# Ahora sí, el repo completo (respetará .dockerignore)
COPY . .

# Instala SOLO db + api desde el store (offline), incluyendo devDeps
RUN pnpm install --filter ./packages/db... --filter ./apps/api... --offline

# Build TS → JS (db y api)
RUN pnpm -r --filter ./packages/db... --filter ./apps/api... build

# Empaqueta SOLO lo necesario de api para prod (incluye node_modules ya compilados)
RUN pnpm deploy --filter ./apps/api --prod --legacy /out

# ---- runtime (ligero) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiamos el paquete “deployado”
COPY --from=builder /out ./

# curl para healthcheck
RUN apk add --no-cache curl

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
