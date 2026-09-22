package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/handlers"
	"go-qr-api/internal/httpx"
	"go-qr-api/internal/statsclient"
)

func main() {
	statsAPIURL := os.Getenv("STATS_API_URL")
	if statsAPIURL == "" {
		statsAPIURL = "http://localhost:3000"
	}

	qrHandler := handlers.NewHandler(statsclient.New(statsAPIURL))

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.JSONErrorHandler,
	})

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/api/qr", qrHandler.QR)

	log.Fatal(app.Listen(":8080"))
}
