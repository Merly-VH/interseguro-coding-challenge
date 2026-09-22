package matrix_test

import (
	"math"
	"strings"
	"testing"

	"go-qr-api/internal/matrix"
)

func multiply(a, b matrix.Matrix) matrix.Matrix {
	rows, inner, cols := a.Rows(), a.Cols(), b.Cols()
	result := make(matrix.Matrix, rows)
	for i := range result {
		result[i] = make([]float64, cols)
		for j := 0; j < cols; j++ {
			sum := 0.0
			for k := 0; k < inner; k++ {
				sum += a[i][k] * b[k][j]
			}
			result[i][j] = sum
		}
	}
	return result
}

func transpose(a matrix.Matrix) matrix.Matrix {
	rows, cols := a.Rows(), a.Cols()
	result := make(matrix.Matrix, cols)
	for i := range result {
		result[i] = make([]float64, rows)
		for j := 0; j < rows; j++ {
			result[i][j] = a[j][i]
		}
	}
	return result
}

func identityMatrix(n int) matrix.Matrix {
	m := make(matrix.Matrix, n)
	for i := range m {
		m[i] = make([]float64, n)
		m[i][i] = 1
	}
	return m
}

func approxEqual(a, b matrix.Matrix, tol float64) bool {
	if a.Rows() != b.Rows() || a.Cols() != b.Cols() {
		return false
	}
	for i := range a {
		for j := range a[i] {
			if math.Abs(a[i][j]-b[i][j]) > tol {
				return false
			}
		}
	}
	return true
}

func isUpperTriangular(r matrix.Matrix, tol float64) bool {
	for i := 0; i < r.Rows(); i++ {
		for j := 0; j < r.Cols() && j < i; j++ {
			if math.Abs(r[i][j]) > tol {
				return false
			}
		}
	}
	return true
}

// TestDecompose verifica, para distintas formas de matriz, las propiedades
// que cualquier factorizacion QR valida debe cumplir: R triangular superior,
// Q ortogonal (Q^T * Q = I), y reconstruccion exacta (Q * R = A). Esto evita
// tener que calcular a mano el resultado esperado para cada caso.
func TestDecompose(t *testing.T) {
	cases := []struct {
		name  string
		input matrix.Matrix
	}{
		{"cuadrada 3x3", matrix.Matrix{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}}},
		{"identidad 3x3", identityMatrix(3)},
		{"alta 4x2", matrix.Matrix{{1, 2}, {3, 4}, {5, 6}, {7, 8}}},
		{"ancha 2x4", matrix.Matrix{{1, 2, 3, 4}, {5, 6, 7, 8}}},
		{"vector columna 3x1", matrix.Matrix{{3}, {4}, {0}}},
		{"vector fila 1x3", matrix.Matrix{{3, 4, 0}}},
		{"escalar 1x1", matrix.Matrix{{7}}},
		{"columna inicial en cero", matrix.Matrix{{0, 1}, {0, 2}, {0, 3}}},
		{"con negativos y decimales", matrix.Matrix{{1.5, -2.25}, {-3.1, 4.2}, {0.5, -0.5}}},
	}

	const tol = 1e-8

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			q, r, err := matrix.Decompose(tc.input)
			if err != nil {
				t.Fatalf("Decompose() error = %v", err)
			}

			if !isUpperTriangular(r, 1e-9) {
				t.Errorf("R no es triangular superior: %v", r)
			}

			gotQtQ := multiply(transpose(q), q)
			if !approxEqual(gotQtQ, identityMatrix(q.Rows()), tol) {
				t.Errorf("Q no es ortogonal, Q^T*Q = %v", gotQtQ)
			}

			reconstructed := multiply(q, r)
			if !approxEqual(reconstructed, tc.input, tol) {
				t.Errorf("Q*R = %v, se esperaba la matriz original %v", reconstructed, tc.input)
			}
		})
	}
}

// TestDecompose_KnownReferenceValues usa el ejemplo clasico de factorizacion
// QR por Householder (Wikipedia) para comparar contra valores de referencia
// conocidos, no solo propiedades generales.
func TestDecompose_KnownReferenceValues(t *testing.T) {
	input := matrix.Matrix{{12, -51, 4}, {6, 167, -68}, {-4, 24, -41}}

	_, r, err := matrix.Decompose(input)
	if err != nil {
		t.Fatalf("Decompose() error = %v", err)
	}

	wantDiagonal := []float64{-14, -175, -35}
	for i, want := range wantDiagonal {
		if math.Abs(r[i][i]-want) > 1e-6 {
			t.Errorf("R[%d][%d] = %v, se esperaba %v", i, i, r[i][i], want)
		}
	}
}

func TestValidate(t *testing.T) {
	cases := []struct {
		name    string
		input   matrix.Matrix
		wantErr string
	}{
		{"matriz vacia", matrix.Matrix{}, "vacía"},
		{"fila vacia", matrix.Matrix{{}}, "vacías"},
		{"no rectangular", matrix.Matrix{{1, 2}, {3}}, "rectangular"},
		{"NaN", matrix.Matrix{{math.NaN()}}, "numérico"},
		{"infinito", matrix.Matrix{{math.Inf(1)}}, "numérico"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := matrix.Validate(tc.input)
			if err == nil {
				t.Fatal("se esperaba un error, no hubo ninguno")
			}
			if !strings.Contains(err.Error(), tc.wantErr) {
				t.Errorf("error = %q, se esperaba que contenga %q", err.Error(), tc.wantErr)
			}
		})
	}
}

func TestValidate_ExceedsMaxDimension(t *testing.T) {
	oversized := make(matrix.Matrix, matrix.MaxDimension+1)
	for i := range oversized {
		oversized[i] = []float64{0}
	}

	if err := matrix.Validate(oversized); err == nil {
		t.Fatal("se esperaba un error por exceder el tamaño máximo")
	}
}
