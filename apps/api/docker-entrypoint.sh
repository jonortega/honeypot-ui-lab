#!/bin/sh
set -e

# Si el volumen /data existe, intenta asegurar propiedad para uid/gid 1000 (usuario 'node').
# Si el volumen está montado read-only (como en compose), esto fallará y lo ignoramos.
if [ -d /data ]; then
  chown -R node:node /data 2>/dev/null || true
fi

# Cambia a usuario 'node' y ejecuta el comando original
exec su-exec node:node "$@"
