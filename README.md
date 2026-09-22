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

## API: go-qr-api

### POST /api/qr

Recibe una matriz rectangular y devuelve su factorizacion QR completa
(reflexiones de Householder), tal que `matrix = Q * R`, con `Q` ortogonal
(m x m) y `R` triangular superior / trapezoidal (m x n).

Request:
```json
{ "matrix": [[12, -51, 4], [6, 167, -68], [-4, 24, -41]] }
```

Response `200 OK`:
```json
{
  "q": [[-0.857..., 0.394..., 0.331...], ...],
  "r": [[-14, -21, 14], [0, -175, 70], [0, 0, -35]]
}
```

Errores `400 Bad Request` (formato consistente `{"error": "..."}`):
- Matriz vacia o con filas vacias.
- Matriz no rectangular (filas de distinto largo).
- Valores no numericos (NaN/Infinito).
- Matriz que excede el tamano maximo soportado (1000x1000).

### GET /health

Healthcheck, responde `{"status": "ok"}`.
