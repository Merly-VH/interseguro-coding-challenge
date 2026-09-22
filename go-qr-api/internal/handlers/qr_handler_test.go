package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"

	"go-qr-api/internal/auth"
	"go-qr-api/internal/handlers"
	"go-qr-api/internal/httpx"
	"go-qr-api/internal/middleware"
	"go-qr-api/internal/statsclient"
)

const testJWTSecret = "test-secret-solo-para-pruebas"

// newTestApp arma una app Fiber real (mismo ErrorHandler y middleware JWT
// que main.go) con el handler QR apuntando a statsAPIURL, para probar el
// flujo completo request -> auth -> QR -> llamada HTTP a node-stats-api ->
// respuesta combinada.
func newTestApp(statsAPIURL string) *fiber.App {
	h := handlers.NewHandler(statsclient.New(statsAPIURL))
	requireJWT := middleware.RequireJWT(auth.NewValidator(testJWTSecret))

	app := fiber.New(fiber.Config{
		ErrorHandler: httpx.JSONErrorHandler,
	})
	app.Post("/api/qr", requireJWT, h.QR)
	return app
}

func validTestToken(t *testing.T) string {
	t.Helper()
	token, _, err := auth.NewIssuer(testJWTSecret).Issue()
	if err != nil {
		t.Fatalf("no se pudo emitir el token de prueba: %v", err)
	}
	return token
}

func postJSON(t *testing.T, app *fiber.App, path, bearerToken string, payload any) *http.Response {
	t.Helper()

	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("no se pudo serializar el payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	return resp
}

func TestQR_Success(t *testing.T) {
	statsServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got == "" {
			t.Error("se esperaba que el Authorization del cliente se reenvíe a node-stats-api")
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(statsclient.Stats{
			Max: 1, Min: 0, Sum: 1, Average: 0.5,
			Diagonal: statsclient.DiagonalFlag{Q: true, R: true},
		})
	}))
	defer statsServer.Close()

	app := newTestApp(statsServer.URL)
	resp := postJSON(t, app, "/api/qr", validTestToken(t), map[string]any{"matrix": [][]float64{{1, 0}, {0, 1}}})

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status = %d, se esperaba 200", resp.StatusCode)
	}

	var got handlers.QRResponse
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatalf("no se pudo decodificar la respuesta: %v", err)
	}
	if got.Stats == nil {
		t.Fatal("se esperaba el campo \"stats\" en la respuesta")
	}
	if got.Stats.Max != 1 {
		t.Errorf("stats.max = %v, se esperaba 1", got.Stats.Max)
	}
	if len(got.Q) != 2 || len(got.R) != 2 {
		t.Errorf("dimensiones inesperadas de Q/R: Q=%v R=%v", got.Q, got.R)
	}
}

func TestQR_MissingToken(t *testing.T) {
	app := newTestApp("http://unused.invalid")
	resp := postJSON(t, app, "/api/qr", "", map[string]any{"matrix": [][]float64{{1, 2}, {3, 4}}})

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, se esperaba 401", resp.StatusCode)
	}
}

func TestQR_InvalidToken(t *testing.T) {
	app := newTestApp("http://unused.invalid")
	resp := postJSON(t, app, "/api/qr", "token-invalido", map[string]any{"matrix": [][]float64{{1, 2}, {3, 4}}})

	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status = %d, se esperaba 401", resp.StatusCode)
	}
}

func TestQR_InvalidMatrix(t *testing.T) {
	app := newTestApp("http://unused.invalid")
	resp := postJSON(t, app, "/api/qr", validTestToken(t), map[string]any{"matrix": [][]float64{}})

	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, se esperaba 400", resp.StatusCode)
	}
}

func TestQR_MalformedBody(t *testing.T) {
	app := newTestApp("http://unused.invalid")

	req := httptest.NewRequest(http.MethodPost, "/api/qr", bytes.NewReader([]byte("{esto no es json")))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+validTestToken(t))

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status = %d, se esperaba 400", resp.StatusCode)
	}
}

func TestQR_UpstreamDown(t *testing.T) {
	app := newTestApp("http://127.0.0.1:0")
	resp := postJSON(t, app, "/api/qr", validTestToken(t), map[string]any{"matrix": [][]float64{{1, 2}, {3, 4}}})

	if resp.StatusCode != http.StatusBadGateway {
		t.Fatalf("status = %d, se esperaba 502", resp.StatusCode)
	}
}
