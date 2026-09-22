package main

import (
	"errors"
	"log"
	"os"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/handlers"
	"go-qr-api/internal/statsclient"
)

func main() {
	statsAPIURL := os.Getenv("STATS_API_URL")
	if statsAPIURL == "" {
		statsAPIURL = "http://localhost:3000"
	}

	qrHandler := handlers.NewHandler(statsclient.New(statsAPIURL))

	app := fiber.New(fiber.Config{
		ErrorHandler: jsonErrorHandler,
	})

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/api/qr", qrHandler.QR)

	log.Fatal(app.Listen(":8080"))
}

// jsonErrorHandler asegura que cualquier error devuelto por un handler
// (incluidos los generados con fiber.NewError) se responda en el mismo
// formato JSON {"error": "..."} en vez del texto plano por defecto de Fiber.
func jsonErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "error interno del servidor"

	var fiberErr *fiber.Error
	if errors.As(err, &fiberErr) {
		code = fiberErr.Code
		message = fiberErr.Message
	}

	return c.Status(code).JSON(fiber.Map{"error": message})
}
