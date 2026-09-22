package handlers_test

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/auth"
	"go-qr-api/internal/handlers"
	"go-qr-api/internal/httpx"
)

const testAPIKey = "test-api-key"

func newTokenTestApp() *fiber.App {
	h := handlers.NewTokenHandler(auth.NewIssuer(testJWTSecret), testAPIKey)
	app := fiber.New(fiber.Config{ErrorHandler: httpx.JSONErrorHandler})
	app.Post("/api/token", h.IssueToken)
	return app
}

func TestIssueToken_ValidAPIKey(t *testing.T) {
	app := newTokenTestApp()

	req := httptest.NewRequest("POST", "/api/token", nil)
	req.Header.Set("X-Api-Key", testAPIKey)

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != 200 {
		t.Fatalf("status = %d, se esperaba 200", resp.StatusCode)
	}

	var body struct {
		Token     string `json:"token"`
		ExpiresIn int    `json:"expiresIn"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		t.Fatalf("no se pudo decodificar la respuesta: %v", err)
	}
	if body.Token == "" {
		t.Error("se esperaba un token no vacío")
	}
	if body.ExpiresIn <= 0 {
		t.Errorf("expiresIn = %d, se esperaba > 0", body.ExpiresIn)
	}

	// El token emitido debe ser válido para un Validator con el mismo secreto.
	if err := auth.NewValidator(testJWTSecret).Verify(body.Token); err != nil {
		t.Errorf("el token emitido no pasa la validación: %v", err)
	}
}

func TestIssueToken_MissingAPIKey(t *testing.T) {
	app := newTokenTestApp()

	req := httptest.NewRequest("POST", "/api/token", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != 401 {
		t.Fatalf("status = %d, se esperaba 401", resp.StatusCode)
	}
}

func TestIssueToken_WrongAPIKey(t *testing.T) {
	app := newTokenTestApp()

	req := httptest.NewRequest("POST", "/api/token", nil)
	req.Header.Set("X-Api-Key", "clave-incorrecta")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != 401 {
		t.Fatalf("status = %d, se esperaba 401", resp.StatusCode)
	}
}
