// Package statsclient implementa el cliente HTTP que go-qr-api usa para
// comunicarse con node-stats-api
package statsclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const defaultTimeout = 5 * time.Second

// Client llama al endpoint POST /api/stats de node-stats-api.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// New crea un Client apuntando a baseURL (ej. "http://localhost:3000").
func New(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: defaultTimeout},
	}
}

type statsRequest struct {
	Q [][]float64 `json:"q"`
	R [][]float64 `json:"r"`
}

// Stats replica la forma de la respuesta de POST /api/stats en node-stats-api.
type Stats struct {
	Max      float64      `json:"max"`
	Min      float64      `json:"min"`
	Sum      float64      `json:"sum"`
	Average  float64      `json:"average"`
	Diagonal DiagonalFlag `json:"diagonal"`
}

// DiagonalFlag indica si Q y/o R son matrices diagonales.
type DiagonalFlag struct {
	Q bool `json:"q"`
	R bool `json:"r"`
}

// ComputeStats envía q y r a node-stats-api y devuelve las estadísticas
// calculadas. El ctx recibido controla el timeout/cancelación del request.
func (c *Client) ComputeStats(ctx context.Context, q, r [][]float64) (*Stats, error) {
	body, err := json.Marshal(statsRequest{Q: q, R: r})
	if err != nil {
		return nil, fmt.Errorf("error al serializar la solicitud a node-stats-api: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/stats", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("error al construir la solicitud a node-stats-api: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("no se pudo contactar a node-stats-api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("node-stats-api respondió con estado %d", resp.StatusCode)
	}

	var stats Stats
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return nil, fmt.Errorf("error al leer la respuesta de node-stats-api: %w", err)
	}

	return &stats, nil
}
