// Valor de respaldo cuando config.json no trae apiBaseUrl (desarrollo local
// con `ng serve`, sin Docker de por medio). En Docker/Render, la URL real
// de go-qr-api la inyecta docker-entrypoint.sh via config.json — ver
// RuntimeConfigService.
export const DEFAULT_API_BASE_URL = 'http://localhost:8080';
