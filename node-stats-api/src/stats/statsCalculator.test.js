const test = require('node:test');
const assert = require('node:assert/strict');

const { computeAggregate, isDiagonal, computeStats } = require('./statsCalculator');

test('computeAggregate calcula max, min, suma y promedio', () => {
  const result = computeAggregate([1, 2, 3, 4]);
  assert.equal(result.max, 4);
  assert.equal(result.min, 1);
  assert.equal(result.sum, 10);
  assert.equal(result.average, 2.5);
});

test('computeAggregate maneja negativos y decimales', () => {
  const result = computeAggregate([-5, 2.5, 0, 10]);
  assert.equal(result.max, 10);
  assert.equal(result.min, -5);
  assert.equal(result.sum, 7.5);
});

test('isDiagonal es true para una matriz diagonal', () => {
  assert.equal(isDiagonal([[1, 0], [0, 2]]), true);
});

test('isDiagonal es false si hay valores fuera de la diagonal', () => {
  assert.equal(isDiagonal([[1, 0], [3, 2]]), false);
});

test('isDiagonal es false para matrices no cuadradas', () => {
  assert.equal(isDiagonal([[1, 0, 0], [0, 1, 0]]), false);
});

test('isDiagonal tolera ruido de punto flotante', () => {
  assert.equal(isDiagonal([[1, 1e-12], [1e-13, 2]]), true);
});

test('computeStats combina los valores de q y r', () => {
  const stats = computeStats([[1, 2]], [[3, 4]]);
  assert.equal(stats.max, 4);
  assert.equal(stats.min, 1);
  assert.equal(stats.sum, 10);
  assert.equal(stats.average, 2.5);
  assert.equal(stats.diagonal.q, false);
  assert.equal(stats.diagonal.r, false);
});

// Regresion: computeAggregate usaba Math.max(...values), que desborda el
// stack de V8 con arreglos grandes. Esta prueba lo ejercita a la escala
// maxima permitida por la validacion (1000x1000).
test('computeStats no desborda el stack con matrices grandes', () => {
  const size = 1000;
  const big = Array.from({ length: size }, () => Array.from({ length: size }, () => 1));
  const stats = computeStats(big, [[5]]);
  assert.equal(stats.max, 5);
  assert.equal(stats.min, 1);
  assert.equal(stats.sum, size * size + 5);
});
