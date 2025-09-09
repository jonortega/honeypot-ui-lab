# ---- build deps & compile (monorepo + pnpm workspaces) ----
FROM node:20-alpine AS builder
WORKDIR /repo
RUN corepack enable

# Herramientas de build (coherente con el resto) y compatibilidad para sharp
RUN apk add --no-cache python3 make g++ libc6-compat

# Copiamos lo mínimo para cachear deps por workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json apps/dashboard/

# Pre-resuelve deps de prod del dashboard (mejor caché)
RUN pnpm fetch --filter ./apps/dashboard...

# Ahora sí, el repo completo (respetará .dockerignore)
COPY . .

# Instala SOLO el dashboard desde el store (sin ir a la red)
RUN pnpm install --filter ./apps/dashboard... --offline

# Build Next.js (App Router) del dashboard
RUN pnpm -r --filter ./apps/dashboard... build

# Empaqueta SOLO lo necesario para prod del dashboard (incluye node_modules y .next)
RUN pnpm deploy --filter ./apps/dashboard --prod --legacy /out

# ---- runtime (ligero) ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Compatibilidad para sharp y curl para healthcheck
RUN apk add --no-cache libc6-compat curl

# Copiamos el paquete “deployado”
COPY --from=builder /out ./

# Artefactos que pnpm deploy NO copia
COPY --from=builder /repo/apps/dashboard/.next ./.next
# COPY --from=builder /repo/apps/dashboard/public ./public

# Usuario sin privilegios
USER node

EXPOSE 3001
# Usamos el binario de next desde node para no depender de pnpm en runtime
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001"]
