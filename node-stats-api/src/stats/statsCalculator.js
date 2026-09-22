// Tolerancia para tratar residuos de punto flotante (p.ej. 1e-16) como cero
// al verificar diagonalidad.
const DIAGONAL_TOLERANCE = 1e-9;

function computeAggregate(values) {
  let max = -Infinity;
  let min = Infinity;
  let sum = 0;

  for (const value of values) {
    if (value > max) max = value;
    if (value < min) min = value;
    sum += value;
  }

  return { max, min, sum, average: sum / values.length };
}

function isDiagonal(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  if (rows !== cols) return false;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i !== j && Math.abs(matrix[i][j]) > DIAGONAL_TOLERANCE) {
        return false;
      }
    }
  }
  return true;
}

function computeStats(q, r) {
  const combined = [...q.flat(), ...r.flat()];
  const aggregate = computeAggregate(combined);

  return {
    ...aggregate,
    diagonal: {
      q: isDiagonal(q),
      r: isDiagonal(r),
    },
  };
}

module.exports = { computeStats, computeAggregate, isDiagonal };
