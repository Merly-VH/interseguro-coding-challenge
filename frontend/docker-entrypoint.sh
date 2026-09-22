#!/bin/sh
# Genera config.json con la API_KEY real del despliegue (desde el .env que
# ya usa docker-compose para el backend) antes de que nginx empiece a
# servir. Así quien abre la app en el navegador no configura nada.
set -eu

envsubst '${API_KEY}' < /usr/share/nginx/html/config.json.template > /usr/share/nginx/html/config.json

exec "$@"
