const createApp = require('./src/app');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET es una variable de entorno requerida');
  process.exit(1);
}

const app = createApp(JWT_SECRET);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('node-stats-api escuchando en puerto ' + PORT);
});
