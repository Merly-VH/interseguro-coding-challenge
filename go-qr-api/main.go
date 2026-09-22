package main

import (
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"

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

	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:4200"
	}

	qrHandler := handlers.NewHandler(statsclient.New(statsAPIURL))
	tokenHandler := handlers.NewTokenHandler(auth.NewIssuer(jwtSecret), apiKey)
	requireJWT := middleware.RequireJWT(auth.NewValidator(jwtSecret))

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.JSONErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Split(corsOrigins, ","),
		AllowMethods: []string{fiber.MethodGet, fiber.MethodPost},
		AllowHeaders: []string{fiber.HeaderContentType, fiber.HeaderAuthorization, "X-Api-Key"},
	}))

	app.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	app.Post("/api/token", tokenHandler.IssueToken)
	app.Post("/api/qr", requireJWT, qrHandler.QR)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Fatal(app.Listen(":" + port))
}
