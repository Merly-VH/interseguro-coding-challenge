package matrix

import (
	"errors"
	"fmt"
	"math"
)

// MaxDimension limita el tamaño de matriz aceptado para evitar payloads
// que degraden el servicio (protección básica de recursos).
const MaxDimension = 1000

// Matrix representa una matriz rectangular como un slice de filas.
type Matrix [][]float64

// Rows devuelve el número de filas.
func (m Matrix) Rows() int {
	return len(m)
}

// Cols devuelve el número de columnas (0 si la matriz está vacía).
func (m Matrix) Cols() int {
	if len(m) == 0 {
		return 0
	}
	return len(m[0])
}

// Validate verifica que la matriz sea rectangular, no vacía, con valores
// numéricos finitos y dentro de los límites de tamaño soportados.
func Validate(m Matrix) error {
	rows := len(m)
	if rows == 0 {
		return errors.New("la matriz no puede estar vacía")
	}

	cols := len(m[0])
	if cols == 0 {
		return errors.New("las filas de la matriz no pueden estar vacías")
	}

	if rows > MaxDimension || cols > MaxDimension {
		return fmt.Errorf("la matriz excede el tamaño máximo soportado (%dx%d)", MaxDimension, MaxDimension)
	}

	for i, row := range m {
		if len(row) != cols {
			return fmt.Errorf("la matriz no es rectangular: la fila %d tiene %d columnas, se esperaban %d", i, len(row), cols)
		}
		for j, v := range row {
			if math.IsNaN(v) || math.IsInf(v, 0) {
				return fmt.Errorf("valor no numérico en la posición [%d][%d]", i, j)
			}
		}
	}

	return nil
}

func identity(n int) Matrix {
	m := make(Matrix, n)
	for i := range m {
		m[i] = make([]float64, n)
		m[i][i] = 1
	}
	return m
}

func clone(a Matrix) Matrix {
	m := make(Matrix, len(a))
	for i, row := range a {
		m[i] = append([]float64(nil), row...)
	}
	return m
}
