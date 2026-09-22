// Package httpx contiene utilidades HTTP compartidas entre main.go y los
// tests (para que las pruebas ejerciten el mismo comportamiento que
// producción, no el default de Fiber).
package httpx

import (
	"errors"

	"github.com/gofiber/fiber/v3"
)

// JSONErrorHandler asegura que cualquier error devuelto por un handler
// (incluidos los generados con fiber.NewError) se responda en el mismo
// formato JSON {"error": "..."} en vez del texto plano por defecto de Fiber.
func JSONErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "error interno del servidor"

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		code = fiberErr.Code
		message = fiberErr.Message
	}

	return c.Status(code).JSON(fiber.Map{"error": message})
}
