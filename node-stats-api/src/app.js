const express = require('express');
const statsHandler = require('./handlers/statsHandler');

// createApp construye la app Express (rutas + middleware) sin arrancar el
// servidor, para poder testearla con supertest-style requests reales
// (app.listen(0)) sin depender de un puerto fijo.
function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/stats', statsHandler);

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
