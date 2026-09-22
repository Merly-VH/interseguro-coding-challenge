package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/auth"
	"go-qr-api/internal/handlers"
	"go-qr-api/internal/httpx"
	"go-qr-api/internal/middleware"
	"go-qr-api/internal/statsclient"
)

func main() {
	statsAPIURL := os.Getenv("STATS_API_URL")
	if statsAPIURL == "" {
		statsAPIURL = "http://localhost:3000"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	apiKey := os.Getenv("API_KEY")
	if jwtSecret == "" || apiKey == "" {
		log.Fatal("JWT_SECRET y API_KEY son variables de entorno requeridas")
	}

	qrHandler := handlers.NewHandler(statsclient.New(statsAPIURL))
	tokenHandler := handlers.NewTokenHandler(auth.NewIssuer(jwtSecret), apiKey)
	requireJWT := middleware.RequireJWT(auth.NewValidator(jwtSecret))

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.JSONErrorHandler,
	})

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/api/token", tokenHandler.IssueToken)
	app.Post("/api/qr", requireJWT, qrHandler.QR)

	log.Fatal(app.Listen(":8080"))
}
