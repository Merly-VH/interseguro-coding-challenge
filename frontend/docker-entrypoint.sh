#!/bin/sh
# Genera config.json con la API_KEY y la URL real de go-qr-api de este
# despliegue (env vars del contenedor) antes de que nginx empiece a servir.
# Así quien abre la app en el navegador no configura nada.
set -eu

envsubst '${API_KEY} ${API_BASE_URL}' < /usr/share/nginx/html/config.json.template > /usr/share/nginx/html/config.json

exec "$@"
