package statsclient_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"go-qr-api/internal/statsclient"
)

func TestComputeStats_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("metodo = %s, se esperaba POST", r.Method)
		}
		if r.URL.Path != "/api/stats" {
			t.Errorf("path = %s, se esperaba /api/stats", r.URL.Path)
		}

		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Fatalf("no se pudo decodificar el body enviado: %v", err)
		}
		if _, ok := body["q"]; !ok {
			t.Error("el body enviado no incluye \"q\"")
		}
		if _, ok := body["r"]; !ok {
			t.Error("el body enviado no incluye \"r\"")
		}
		if got := r.Header.Get("Authorization"); got != "Bearer test-token" {
			t.Errorf("Authorization = %q, se esperaba \"Bearer test-token\" (pass-through del cliente)", got)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(statsclient.Stats{
			Max: 3, Min: -1, Sum: 4, Average: 1,
			Diagonal: statsclient.DiagonalFlag{Q: true, R: false},
		})
	}))
	defer server.Close()

	client := statsclient.New(server.URL)
	stats, err := client.ComputeStats(context.Background(), [][]float64{{1, 0}, {0, 1}}, [][]float64{{2, 0}, {0, 3}}, "Bearer test-token")
	if err != nil {
		t.Fatalf("ComputeStats() error = %v", err)
	}

	if stats.Max != 3 || stats.Min != -1 || stats.Sum != 4 || stats.Average != 1 {
		t.Errorf("stats = %+v, no coincide con lo devuelto por el servidor", stats)
	}
	if !stats.Diagonal.Q || stats.Diagonal.R {
		t.Errorf("diagonal = %+v, no coincide con lo devuelto por el servidor", stats.Diagonal)
	}
}

func TestComputeStats_UpstreamErrorStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer server.Close()

	client := statsclient.New(server.URL)
	if _, err := client.ComputeStats(context.Background(), [][]float64{{1}}, [][]float64{{1}}, ""); err == nil {
		t.Fatal("se esperaba un error cuando el upstream responde con estado de error")
	}
}

func TestComputeStats_UpstreamUnreachable(t *testing.T) {
	// Puerto que nadie escucha: fuerza un error de conexion sin depender de red externa.
	client := statsclient.New("http://127.0.0.1:0")
	if _, err := client.ComputeStats(context.Background(), [][]float64{{1}}, [][]float64{{1}}, ""); err == nil {
		t.Fatal("se esperaba un error cuando el upstream no responde")
	}
}

func TestComputeStats_MalformedResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("esto no es json"))
	}))
	defer server.Close()

	client := statsclient.New(server.URL)
	if _, err := client.ComputeStats(context.Background(), [][]float64{{1}}, [][]float64{{1}}, ""); err == nil {
		t.Fatal("se esperaba un error cuando la respuesta no es JSON valido")
	}
}
