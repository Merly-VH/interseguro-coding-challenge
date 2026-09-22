const ApiError = require('../errors/ApiError');

// Mismo límite que go-qr-api, para mantener coherencia entre ambas APIs.
const MAX_DIMENSION = 1000;

function validateMatrix(matrix, name) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new ApiError(400, `el campo "${name}" es requerido y debe ser una matriz no vacía`);
  }

  const cols = Array.isArray(matrix[0]) ? matrix[0].length : 0;
  if (cols === 0) {
    throw new ApiError(400, `las filas de "${name}" no pueden estar vacías`);
  }

  if (matrix.length > MAX_DIMENSION || cols > MAX_DIMENSION) {
    throw new ApiError(400, `"${name}" excede el tamaño máximo soportado (${MAX_DIMENSION}x${MAX_DIMENSION})`);
  }

  matrix.forEach((row, i) => {
    if (!Array.isArray(row) || row.length !== cols) {
      const actualCols = Array.isArray(row) ? row.length : 'N/A';
      throw new ApiError(
        400,
        `"${name}" no es rectangular: la fila ${i} tiene ${actualCols} columnas, se esperaban ${cols}`
      );
    }
    row.forEach((value, j) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ApiError(400, `valor no numérico en "${name}[${i}][${j}]"`);
      }
    });
  });
}

module.exports = { validateMatrix, MAX_DIMENSION };
