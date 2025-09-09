#!/usr/bin/env bash
set -euo pipefail

: "${HNY_ADMIN_TOKEN:?exporta HNY_ADMIN_TOKEN primero}"

echo "▶️  Levantando honeypot + api…"
docker compose up -d honeypot api

echo "⏳ Esperando a honeypot healthy…"
until [ "$(docker inspect -f '{{.State.Health.Status}}' honeypot 2>/dev/null || echo starting)" = "healthy" ]; do
  sleep 1
done

echo "🩺 API /health"
curl -fsS http://localhost:3000/health && echo

echo "🎣 Generando evento de prueba (HTTP)…"
curl -fsS -X POST -d 'username=foo&password=bar' http://localhost:8080/login || true

echo "📄 API /api/events"
curl -fsS -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "http://localhost:3000/api/events?limit=5" | jq .

echo "📊 API /api/stats/summary"
curl -fsS -H "Authorization: Bearer $HNY_ADMIN_TOKEN" \
  "http://localhost:3000/api/stats/summary?top=5" | jq .

echo "✅ Smoke-test OK"
