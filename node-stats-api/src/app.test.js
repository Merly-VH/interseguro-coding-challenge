const test = require('node:test');
const assert = require('node:assert/strict');

const createApp = require('./app');

function startServer() {
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('GET /health responde ok', async () => {
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

test('POST /api/stats con Q y R validos responde 200 con las estadisticas', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

test('POST /api/stats sin el campo r responde 400', async () => {
  const server = await startServer();
  try {
    const { port } = server.address();
    const res = await fetch(`http://localhost:${port}/api/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: '{esto no es json',
    });
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
