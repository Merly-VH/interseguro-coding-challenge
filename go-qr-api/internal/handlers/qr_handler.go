package handlers

import (
	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/matrix"
)

// QRRequest es el cuerpo esperado por POST /api/qr.
type QRRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

// QRResponse es la respuesta de POST /api/qr: la matriz original factorizada
// en Q (ortogonal) y R (triangular superior), tal que matrix = Q * R.
type QRResponse struct {
	Q [][]float64 `json:"q"`
	R [][]float64 `json:"r"`
}

// QR maneja POST /api/qr: recibe una matriz rectangular y devuelve su
// factorización QR calculada por reflexiones de Householder.
func QR(c fiber.Ctx) error {
	var req QRRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, `cuerpo inválido: se espera {"matrix": [[...]]}`)
	}

	q, r, err := matrix.Decompose(matrix.Matrix(req.Matrix))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(QRResponse{Q: q, R: r})
}
