package handlers

import (
	"crypto/subtle"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/auth"
)

// TokenHandler emite JWTs a cambio de una API key compartida.
type TokenHandler struct {
	issuer *auth.Issuer
	apiKey string
}

// NewTokenHandler construye un TokenHandler con sus dependencias.
func NewTokenHandler(issuer *auth.Issuer, apiKey string) *TokenHandler {
	return &TokenHandler{issuer: issuer, apiKey: apiKey}
}

// IssueToken maneja POST /api/token: valida el header X-Api-Key y, si es
// correcto, devuelve un JWT de corta duración para usar en los endpoints
// protegidos de ambas APIs.
func (h *TokenHandler) IssueToken(c fiber.Ctx) error {
	provided := c.Get("X-Api-Key")
	if subtle.ConstantTimeCompare([]byte(provided), []byte(h.apiKey)) != 1 {
		return fiber.NewError(fiber.StatusUnauthorized, `X-Api-Key inválida o ausente`)
	}

	token, expiresIn, err := h.issuer.Issue()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "no se pudo generar el token")
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"token":     token,
		"expiresIn": expiresIn,
	})
}
