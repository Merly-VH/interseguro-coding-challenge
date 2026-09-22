package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/auth"
)

// RequireJWT construye un middleware Fiber que exige un JWT válido en el
// header Authorization (formato "Bearer <token>"), verificado contra validator.
func RequireJWT(validator *auth.Validator) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)

		const prefix = "Bearer "
		if !strings.HasPrefix(header, prefix) {
			return fiber.NewError(fiber.StatusUnauthorized, `falta el token de autorización (header "Authorization: Bearer <token>")`)
		}

		token := strings.TrimPrefix(header, prefix)
		if err := validator.Verify(token); err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "token inválido o expirado")
		}

		return c.Next()
	}
}
