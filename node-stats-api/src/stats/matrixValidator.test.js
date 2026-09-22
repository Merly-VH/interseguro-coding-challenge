const test = require('node:test');
const assert = require('node:assert/strict');

const { validateMatrix, MAX_DIMENSION } = require('./matrixValidator');
const ApiError = require('../errors/ApiError');

test('acepta una matriz rectangular valida', () => {
  assert.doesNotThrow(() => validateMatrix([[1, 2], [3, 4]], 'q'));
});

test('rechaza un campo faltante o no-arreglo', () => {
  assert.throws(() => validateMatrix(undefined, 'q'), ApiError);
});

test('rechaza una matriz vacia', () => {
  assert.throws(() => validateMatrix([], 'q'), ApiError);
});

test('rechaza filas vacias', () => {
  assert.throws(() => validateMatrix([[]], 'q'), ApiError);
});

test('rechaza matrices no rectangulares', () => {
  assert.throws(() => validateMatrix([[1, 2], [3]], 'q'), ApiError);
});

test('rechaza valores no numericos', () => {
  assert.throws(() => validateMatrix([[1, 'x']], 'q'), ApiError);
});

test('rechaza NaN e Infinity', () => {
  assert.throws(() => validateMatrix([[NaN]], 'q'), ApiError);
  assert.throws(() => validateMatrix([[Infinity]], 'q'), ApiError);
});

test('rechaza matrices que exceden el tamaño maximo', () => {
  const oversized = Array.from({ length: MAX_DIMENSION + 1 }, () => [0]);
  assert.throws(() => validateMatrix(oversized, 'q'), ApiError);
});
