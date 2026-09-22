// Package auth emite y valida los JWT usados para proteger los endpoints
// de negocio de ambas APIs, firmados con HS256 y un secreto compartido.
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// tokenTTL es la vigencia de cada token emitido.
const tokenTTL = 15 * time.Minute

// Issuer emite tokens firmados con un secreto compartido.
type Issuer struct {
	secret []byte
}

// NewIssuer crea un Issuer para el secreto dado.
func NewIssuer(secret string) *Issuer {
	return &Issuer{secret: []byte(secret)}
}

// Issue genera un JWT válido por tokenTTL y devuelve el token junto con su
// vigencia en segundos.
func (i *Issuer) Issue() (token string, expiresInSeconds int, err error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Issuer:    "go-qr-api",
		Subject:   "service-client",
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
	}

	signed, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(i.secret)
	if err != nil {
		return "", 0, err
	}
	return signed, int(tokenTTL.Seconds()), nil
}

// Validator verifica la firma y vigencia de los tokens emitidos por Issuer.
type Validator struct {
	secret []byte
}

// NewValidator crea un Validator para el secreto dado.
func NewValidator(secret string) *Validator {
	return &Validator{secret: []byte(secret)}
}

// Verify rechaza el token si la firma no coincide, si expiró, o si usa un
// algoritmo distinto al esperado (evita ataques de confusión de algoritmo).
func (v *Validator) Verify(tokenString string) error {
	_, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de firma inesperado")
		}
		return v.secret, nil
	})
	return err
}
