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
- docs/            Documentacion tecnica y decisiones

## Como levantar el entorno
(pendiente, se agrega en la fase de Docker)

## Variables de entorno

| Variable       | API         | Default                 | Descripcion                                    |
|----------------|-------------|--------------------------|------------------------------------------------|
| `PORT`         | node-stats-api | `3000`                | Puerto donde escucha node-stats-api.           |
| `STATS_API_URL`| go-qr-api   | `http://localhost:3000` | URL base de node-stats-api (comunicacion HTTP). |

## API: go-qr-api

### POST /api/qr

Recibe una matriz rectangular, calcula su factorizacion QR completa
(reflexiones de Householder, tal que `matrix = Q * R`, con `Q` ortogonal
m x m y `R` triangular superior / trapezoidal m x n), envia Q y R a
node-stats-api, y devuelve todo combinado en una sola respuesta.

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
- `502 Bad Gateway`: node-stats-api no respondio (caida, timeout de 5s, o
  respuesta invalida).

### GET /health

Healthcheck, responde `{"status": "ok"}`.

## API: node-stats-api

### POST /api/stats

Recibe `q` y `r` (las matrices devueltas por `go-qr-api`) y calcula
estadisticas sobre el conjunto combinado de sus valores: maximo, minimo,
promedio, suma total, y verificacion de diagonalidad de cada matriz por
separado (una matriz no cuadrada nunca es diagonal).

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

Errores `400 Bad Request` (formato consistente `{"error": "..."}`):
- Falta el campo `q` o `r`, o no es una matriz no vacia.
- Matriz no rectangular.
- Valores no numericos.
- Matriz que excede el tamano maximo soportado (1000x1000).
- Cuerpo JSON malformado.

### GET /health

Healthcheck, responde `{"status": "ok"}`.
