const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const createApp = require('./app');

const TEST_SECRET = 'test-secret-solo-para-pruebas';

function startServer() {
  const app = createApp(TEST_SECRET);
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function validToken() {
  return jwt.sign({}, TEST_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}

test('GET /health responde ok sin autenticacion', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  } finally {
    server.close();
  }
});

test('POST /api/stats con token valido responde 200 con las estadisticas', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken()}` },
      body: JSON.stringify({ q: [[1, 0], [0, 1]], r: [[2, 0], [0, 3]] }),
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.max, 3);
    assert.equal(body.min, 0);
    assert.equal(body.sum, 7);
    assert.equal(body.diagonal.q, true);
    assert.equal(body.diagonal.r, true);
  } finally {
    server.close();
  }
});

test('POST /api/stats sin token responde 401', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: [[1, 0], [0, 1]], r: [[2, 0], [0, 3]] }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('POST /api/stats con token invalido responde 401', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-invalido' },
      body: JSON.stringify({ q: [[1, 0], [0, 1]], r: [[2, 0], [0, 3]] }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('POST /api/stats con token firmado con otro secreto responde 401', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const otroSecreto = jwt.sign({}, 'secreto-equivocado', { algorithm: 'HS256', expiresIn: '15m' });
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otroSecreto}` },
      body: JSON.stringify({ q: [[1, 0], [0, 1]], r: [[2, 0], [0, 3]] }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('POST /api/stats con token expirado responde 401', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const expired = jwt.sign({}, TEST_SECRET, { algorithm: 'HS256', expiresIn: -10 });
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${expired}` },
      body: JSON.stringify({ q: [[1, 0], [0, 1]], r: [[2, 0], [0, 3]] }),
    });
    assert.equal(res.status, 401);
  } finally {
    server.close();
  }
});

test('POST /api/stats sin el campo r responde 400', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken()}` },
      body: JSON.stringify({ q: [[1, 2], [3, 4]] }),
    });
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.match(body.error, /"r"/);
  } finally {
    server.close();
  }
});

test('POST /api/stats con JSON malformado responde 400', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${validToken()}` },
      body: '{esto no es json',
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
