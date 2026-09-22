package matrix

import "math"

// zeroTolerance es el umbral bajo el cual un valor de R se considera ruido
// numérico de punto flotante y se redondea a cero.
const zeroTolerance = 1e-9

// Decompose calcula la factorización QR completa de a (m x n) mediante
// reflexiones de Householder, de modo que a = q * r, con q ortogonal (m x m)
// y r triangular superior / trapezoidal (m x n).
func Decompose(a Matrix) (q, r Matrix, err error) {
	if err := Validate(a); err != nil {
		return nil, nil, err
	}

	rows, cols := a.Rows(), a.Cols()
	r = clone(a)
	q = identity(rows)

	steps := rows
	if cols < steps {
		steps = cols
	}

	for k := 0; k < steps; k++ {
		if rows-k < 2 {
			continue // una sola fila restante bajo la diagonal: ya es triangular
		}

		v, ok := householderVector(r, k)
		if !ok {
			continue // la columna ya es cero por debajo de la diagonal
		}

		reflectColumns(r, v, k)
		reflectRows(q, v, k)
	}

	roundNearZeroBelowDiagonal(r)
	return q, r, nil
}

// householderVector construye el vector unitario v tal que reflejar la
// columna k de r (desde la fila k) con H = I - 2vv^T anula todo lo que
// queda debajo de la diagonal en esa columna.
func householderVector(r Matrix, k int) (v []float64, ok bool) {
	x := make([]float64, r.Rows()-k)
	for i := range x {
		x[i] = r[k+i][k]
	}

	normX := euclideanNorm(x)
	if normX == 0 {
		return nil, false
	}

	// El signo se elige opuesto a x[0] para evitar cancelación catastrófica
	// al restar dos números casi iguales.
	alpha := -math.Copysign(normX, x[0])

	v = x
	v[0] -= alpha
	normV := euclideanNorm(v)
	if normV == 0 {
		return nil, false
	}
	for i := range v {
		v[i] /= normV
	}
	return v, true
}

// reflectColumns aplica H = I - 2vv^T por la izquierda sobre el bloque
// r[k:, k:], que es la operación que produce R.
func reflectColumns(r Matrix, v []float64, k int) {
	cols := r.Cols()
	for j := k; j < cols; j++ {
		dot := 0.0
		for i, vi := range v {
			dot += vi * r[k+i][j]
		}
		for i, vi := range v {
			r[k+i][j] -= 2 * vi * dot
		}
	}
}

// reflectRows aplica H por la derecha sobre las columnas q[:, k:], que va
// acumulando Q = H_0 * H_1 * ... * H_{steps-1}.
func reflectRows(q Matrix, v []float64, k int) {
	rows := q.Rows()
	for i := 0; i < rows; i++ {
		dot := 0.0
		for jj, vj := range v {
			dot += q[i][k+jj] * vj
		}
		for jj, vj := range v {
			q[i][k+jj] -= 2 * dot * vj
		}
	}
}

func euclideanNorm(v []float64) float64 {
	sum := 0.0
	for _, x := range v {
		sum += x * x
	}
	return math.Sqrt(sum)
}

func roundNearZeroBelowDiagonal(r Matrix) {
	for i := 0; i < r.Rows(); i++ {
		for j := 0; j < r.Cols() && j < i; j++ {
			if math.Abs(r[i][j]) < zeroTolerance {
				r[i][j] = 0
			}
		}
	}
}
