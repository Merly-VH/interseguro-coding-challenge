const express = require('express');
const statsHandler = require('./src/handlers/statsHandler');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('node-stats-api escuchando en puerto ' + PORT);
});
