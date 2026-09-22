package handlers

import (
	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/matrix"
	"go-qr-api/internal/statsclient"
)

// QRRequest es el cuerpo esperado por POST /api/qr.
type QRRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

// QRResponse es la respuesta de POST /api/qr: la matriz original factorizada
// en Q y R, junto con las estadísticas calculadas por node-stats-api.
type QRResponse struct {
	Q     [][]float64        `json:"q"`
	R     [][]float64        `json:"r"`
	Stats *statsclient.Stats `json:"stats"`
}

// Handler agrupa las dependencias de los handlers HTTP de go-qr-api.
type Handler struct {
	statsClient *statsclient.Client
}

// NewHandler construye un Handler con sus dependencias.
func NewHandler(statsClient *statsclient.Client) *Handler {
	return &Handler{statsClient: statsClient}
}

// QR maneja POST /api/qr: calcula la factorización QR de la matriz recibida,
// envía Q y R a node-stats-api para obtener las estadísticas, y devuelve
// todo en una sola respuesta.
func (h *Handler) QR(c fiber.Ctx) error {
	var req QRRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, `cuerpo inválido: se espera {"matrix": [[...]]}`)
	}

	q, r, err := matrix.Decompose(matrix.Matrix(req.Matrix))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	stats, err := h.statsClient.ComputeStats(c.Context(), q, r, c.Get(fiber.HeaderAuthorization))
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "no se pudieron calcular las estadísticas: "+err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(QRResponse{Q: q, R: r, Stats: stats})
}
