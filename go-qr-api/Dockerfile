FROM golang:1.27-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/go-qr-api .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && \
    adduser -D -u 10001 appuser

COPY --from=build /out/go-qr-api /usr/local/bin/go-qr-api

USER appuser
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/go-qr-api"]
