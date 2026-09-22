const express = require('express');
const statsHandler = require('./handlers/statsHandler');
const createAuthMiddleware = require('./middlewares/authMiddleware');

// createApp construye la app Express (rutas + middleware) sin arrancar el
// servidor, para poder testearla con supertest-style requests reales
// (app.listen(0)) sin depender de un puerto fijo. jwtSecret protege
// /api/stats (debe coincidir con el secreto que usa go-qr-api para emitir
// los tokens en POST /api/token).
function createApp(jwtSecret) {
  const app = express();

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/stats', createAuthMiddleware(jwtSecret), statsHandler);

  // Middleware de errores: unifica el body-parser (JSON malformado) y los
  // ApiError lanzados por los handlers en la misma forma de respuesta.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const message = statusCode === 500 ? 'error interno del servidor' : err.message;
    res.status(statusCode).json({ error: message });
  });

  return app;
}

module.exports = createApp;
