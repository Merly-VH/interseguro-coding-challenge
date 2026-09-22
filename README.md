# Interseguro Coding Challenge

API en Go (Fiber) que calcula la factorizacion QR de una matriz rectangular,
y API en Node.js (Express) que recibe Q y R y calcula estadisticas
(maximo, minimo, promedio, suma total, verificacion de matriz diagonal).

## Estado del proyecto
En construccion. Ver `docs/IS Coding-Challenge - Reto Tecnico.pdf` para el
enunciado original.

## Estructura
- go-qr-api/       API Go + Fiber (factorizacion QR), puerto 8080
- node-stats-api/  API Node.js + Express (estadisticas), puerto 3000
- frontend/        Angular + Angular Material (UI), puerto 4200
- docs/            Documentacion tecnica y decisiones

## Como levantar el entorno

Requiere Docker y Docker Compose.

```bash
cp .env.example .env   # completar JWT_SECRET y API_KEY
docker compose up --build
```

Esto construye ambas imagenes (multi-stage, corren como usuario no-root) y
las levanta en una red interna compartida: `go-qr-api` espera a que
`node-stats-api` este saludable (`healthcheck`) antes de arrancar, y le
habla por su nombre de servicio (`http://node-stats-api:3000`) via
`STATS_API_URL`.

- go-qr-api: http://localhost:8080
- node-stats-api: http://localhost:3000
- frontend: http://localhost:4200

Para detener y limpiar:
```bash
docker compose down
```

## Testing

**go-qr-api** (tests unitarios de la factorizacion QR y de integracion del
handler HTTP + cliente contra node-stats-api simulado con `httptest`):
```bash
cd go-qr-api
go test ./... -v -cover
```

**node-stats-api** (tests unitarios de estadisticas/validacion y de
integracion del servidor Express completo, con el test runner nativo de
Node, sin dependencias extra):
```bash
cd node-stats-api
npm test
```

**frontend** (tests unitarios de servicios y componentes, con Vitest vía
`@angular/build:unit-test`):
```bash
cd frontend
npm test
```

## Variables de entorno

| Variable        | API            | Default                 | Descripcion                                                        |
|-----------------|----------------|--------------------------|--------------------------------------------------------------------|
| `PORT`          | node-stats-api | `3000`                   | Puerto donde escucha node-stats-api.                               |
| `STATS_API_URL` | go-qr-api      | `http://localhost:3000` | URL base de node-stats-api (comunicacion HTTP).                    |
| `JWT_SECRET`    | ambas          | *(requerida, sin default)* | Secreto compartido HS256. Debe ser igual en ambos servicios.    |
| `API_KEY`       | go-qr-api      | *(requerida, sin default)* | Credencial para emitir tokens en `POST /api/token`.              |
| `CORS_ALLOWED_ORIGINS` | go-qr-api | `http://localhost:4200` | Origenes permitidos (separados por coma) para llamadas desde el navegador. |

`JWT_SECRET` y `API_KEY` no tienen valor por defecto a proposito: ambos
servicios se niegan a arrancar si faltan (fail-fast), para no correr nunca
con un secreto hardcodeado.

## Autenticacion (JWT)

`POST /api/qr` (go-qr-api) y `POST /api/stats` (node-stats-api) requieren
un JWT valido en el header `Authorization: Bearer <token>`. `GET /health`
no requiere autenticacion en ninguna de las dos.

1. Pedir un token a go-qr-api con la API key compartida:
   ```bash
   curl -X POST http://localhost:8080/api/token -H "X-Api-Key: <API_KEY>"
   # -> {"token": "...", "expiresIn": 900}
   ```
2. Usar ese token en las llamadas a los endpoints protegidos:
   ```bash
   curl -X POST http://localhost:8080/api/qr \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{"matrix": [[12, -51, 4], [6, 167, -68], [-4, 24, -41]]}'
   ```

go-qr-api no vuelve a emitir un token para llamar a node-stats-api: reenvia
el mismo `Authorization` que recibio del cliente (ambos servicios validan
contra el mismo `JWT_SECRET`), por eso ese mismo token tambien funciona
llamando a `node-stats-api` directamente.

Tokens firmados con HS256, vigencia de 15 minutos, sin sistema de
usuarios (el reto no define uno): la API key representa una credencial de
servicio, no una cuenta de persona.

## API: go-qr-api

### POST /api/token

Emite un JWT de corta duracion a cambio de la API key compartida.

Request: sin body, header `X-Api-Key: <API_KEY>`.

Response `200 OK`:
```json
{ "token": "eyJhbGciOi...", "expiresIn": 900 }
```

Errores: `401 Unauthorized` si `X-Api-Key` falta o no coincide.

### POST /api/qr  🔒 requiere `Authorization: Bearer <token>`

Recibe una matriz rectangular, calcula su factorizacion QR completa
(reflexiones de Householder, tal que `matrix = Q * R`, con `Q` ortogonal
m x m y `R` triangular superior / trapezoidal m x n), envia Q y R a
node-stats-api (reenviando el mismo token), y devuelve todo combinado en
una sola respuesta.

Request:
```json
{ "matrix": [[12, -51, 4], [6, 167, -68], [-4, 24, -41]] }
```

Response `200 OK`:
```json
{
  "q": [[-0.857..., 0.394..., 0.331...], ...],
  "r": [[-14, -21, 14], [0, -175, 70], [0, 0, -35]],
  "stats": {
    "max": 70, "min": -175, "sum": -161.44, "average": -8.97,
    "diagonal": { "q": false, "r": false }
  }
}
```

Errores:
- `400 Bad Request` (formato `{"error": "..."}`): matriz vacia, no
  rectangular, con valores no numericos, o que excede el tamano maximo
  soportado (1000x1000).
- `401 Unauthorized`: falta el token, es invalido, o expiro.
- `502 Bad Gateway`: node-stats-api no respondio (caida, timeout de 5s, o
  respuesta invalida).

### GET /health

Healthcheck, responde `{"status": "ok"}`.

## Frontend

SPA en Angular 22 (standalone, signals, sin zone.js) + Angular Material.
Consume go-qr-api: pide un JWT en `POST /api/token` y llama a `POST /api/qr`
con un interceptor HTTP que adjunta el `Authorization: Bearer <token>`
automáticamente y renueva el token cuando expira.

**Decisión de diseño — API key sin configuración para quien usa la app:**
Angular compila todo a JS que corre en el navegador, así que la `API_KEY`
no puede vivir en el código fuente (quedaría visible en el bundle y
committeada en el repo). La solución: el contenedor del frontend la recibe
en runtime desde el mismo `.env` que ya usa `docker-compose` para el
backend, y un script de arranque (`docker-entrypoint.sh`) la escribe en
`config.json` (via `envsubst`) antes de que nginx empiece a servir. La app
lee ese archivo al iniciar y pide el JWT sola — quien abre
`http://localhost:4200` no ve ningún campo de autenticación, solo la
matriz.

El campo "API key" en la UI existe únicamente como *fallback* para
desarrollar el frontend fuera de Docker (`ng serve`), donde no hay
contenedor que inyecte nada; ahí sí hace falta pegar a mano la misma
`API_KEY` del `.env`.

Desarrollo local (fuera de Docker):
```bash
cd frontend
npm start   # ng serve, puerto 4200
```
Requiere que `go-qr-api` corra con `CORS_ALLOWED_ORIGINS` incluyendo
`http://localhost:4200` (es el default).

## API: node-stats-api

### POST /api/stats  🔒 requiere `Authorization: Bearer <token>`

Recibe `q` y `r` (las matrices devueltas por `go-qr-api`) y calcula
estadisticas sobre el conjunto combinado de sus valores: maximo, minimo,
promedio, suma total, y verificacion de diagonalidad de cada matriz por
separado (una matriz no cuadrada nunca es diagonal). El token debe estar
firmado con el mismo `JWT_SECRET` que usa go-qr-api.

Request:
```json
{ "q": [[1, 0], [0, 1]], "r": [[2, 0], [0, 3]] }
```

Response `200 OK`:
```json
{
  "max": 3,
  "min": 0,
  "sum": 7,
  "average": 0.875,
  "diagonal": { "q": true, "r": true }
}
```

Errores `400/401 Bad Request/Unauthorized` (formato consistente `{"error": "..."}`):
- Falta el campo `q` o `r`, o no es una matriz no vacia.
- Matriz no rectangular.
- Valores no numericos.
- Matriz que excede el tamano maximo soportado (1000x1000).
- Cuerpo JSON malformado.
- Token ausente, invalido o expirado.

### GET /health

Healthcheck, responde `{"status": "ok"}`.

## Despliegue en Render

Los 3 servicios (`node-stats-api`, `go-qr-api`, `frontend`) se despliegan
como Web Services de Docker en [Render](https://render.com) (tier gratuito,
sin tarjeta de credito). El repo incluye `render.yaml` para desplegarlos
juntos con "Blueprint".

**Nota:** el `Dockerfile` de cada servicio no cambia entre local y Render —
la unica diferencia es que Render inyecta su propia variable `PORT`, y
tanto `go-qr-api` como `node-stats-api` ya la respetan (si no esta seteada,
usan 8080 / 3000 como en local).

### Opcion A — Blueprint (recomendada, un solo paso)

1. Crear cuenta en Render con GitHub (gratis, sin tarjeta).
2. **New > Blueprint**, elegir este repositorio. Render deberia detectar
   `render.yaml` y proponer los 3 servicios.
3. Si el Blueprint no valida (puede pasar si Render cambio el esquema),
   usar la **Opcion B** de abajo para cada servicio en su lugar.

### Opcion B — Manual (por si el Blueprint falla)

Repetir "**New > Web Service**" 3 veces, una por carpeta
(`node-stats-api`, `go-qr-api`, `frontend`), conectando el mismo repo y
seteando el "Root Directory" a cada carpeta — Render detecta el
`Dockerfile` solo.

### Configurar variables de entorno (ambas opciones)

En el dashboard de cada servicio, pestaña **Environment**:

| Servicio | Variables |
|---|---|
| `node-stats-api` | `JWT_SECRET` (valor largo y aleatorio) |
| `go-qr-api` | mismo `JWT_SECRET`, `API_KEY` (otro valor aleatorio), `STATS_API_URL`, `CORS_ALLOWED_ORIGINS` |
| `frontend` | mismo `API_KEY` que `go-qr-api` |

`STATS_API_URL` y `CORS_ALLOWED_ORIGINS` no se pueden saber de antemano
(dependen de las URLs que Render asigna). Flujo:

1. Desplegar los 3 servicios con esas dos variables en blanco (o con
   cualquier valor provisorio) — van a fallar al arrancar o al llamarse
   entre si, es esperado.
2. Cuando los 3 esten "Live", copiar sus URLs publicas
   (`https://<nombre>.onrender.com`, visibles arriba de cada servicio).
3. En `go-qr-api > Environment`, setear:
   - `STATS_API_URL` = URL publica de `node-stats-api`
   - `CORS_ALLOWED_ORIGINS` = URL publica de `frontend`
4. Guardar — Render redespliega `go-qr-api` solo.
5. Abrir la URL de `frontend` y probar el flujo completo.

### Troubleshooting

- **El servicio no arranca / "port scan timeout"**: en `Settings` del
  servicio, revisar que no haya un override manual de puerto conflictivo;
  si lo hay, borrarlo (dejar que Render use el `PORT` que el Dockerfile
  expone).
- **Primera carga lenta (~30-50s)**: el tier gratuito "duerme" los
  servicios tras inactividad. Es normal, no es un error.
- **Error de CORS en la consola del navegador**: `CORS_ALLOWED_ORIGINS` en
  `go-qr-api` no coincide exactamente con la URL del frontend (con
  `https://`, sin `/` final).

### Que compartir con quien revise

- El **link del frontend** (`https://interseguro-frontend-xxxx.onrender.com`)
  alcanza por si solo: la API key se configura sola (ver seccion
  "Frontend" mas arriba), no requiere ningun dato adicional para usar la UI.
- Si ademas quieren probar las APIs directo (curl/Postman, sin el
  frontend), van a necesitar el valor de `API_KEY` para pedir un token en
  `POST /api/token` — comunicarlo por un canal aparte del repositorio
  (nunca en el propio repo ni en un commit).
