import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../api-config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  function flushConfig(apiKey = ''): void {
    httpMock.expectOne((req) => req.url.startsWith('config.json')).flush({ apiKey });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lee config.json al construirse y marca configChecked', () => {
    expect(service.configChecked()).toBe(false);
    flushConfig('');
    expect(service.configChecked()).toBe(true);
    expect(service.hasConfiguredKey()).toBe(false);
  });

  it('toma la API key de config.json si viene definida (flujo Docker)', () => {
    flushConfig('clave-del-despliegue');

    expect(service.apiKey()).toBe('clave-del-despliegue');
    expect(service.hasConfiguredKey()).toBe(true);
  });

  it('pide un token nuevo cuando no hay uno en caché', () => {
    flushConfig('');
    service.setApiKey('clave-valida');

    let received: string | undefined;
    service.ensureValidToken().subscribe((token) => (received = token));

    const req = httpMock.expectOne(`${API_BASE_URL}/api/token`);
    expect(req.request.headers.get('X-Api-Key')).toBe('clave-valida');
    req.flush({ token: 'jwt-123', expiresIn: 900 });

    expect(received).toBe('jwt-123');
  });

  it('reutiliza el token en caché mientras no haya expirado', () => {
    flushConfig('');
    service.setApiKey('clave-valida');

    service.ensureValidToken().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/api/token`).flush({ token: 'jwt-123', expiresIn: 900 });

    let received: string | undefined;
    service.ensureValidToken().subscribe((token) => (received = token));

    httpMock.expectNone(`${API_BASE_URL}/api/token`);
    expect(received).toBe('jwt-123');
  });

  it('pide un token nuevo si cambia la API key', () => {
    flushConfig('');
    service.setApiKey('clave-1');
    service.ensureValidToken().subscribe();
    httpMock.expectOne(`${API_BASE_URL}/api/token`).flush({ token: 'jwt-1', expiresIn: 900 });

    service.setApiKey('clave-2');
    service.ensureValidToken().subscribe();
    const req = httpMock.expectOne(`${API_BASE_URL}/api/token`);
    expect(req.request.headers.get('X-Api-Key')).toBe('clave-2');
    req.flush({ token: 'jwt-2', expiresIn: 900 });
  });

  it('falla sin llamar al backend si no hay API key', () => {
    flushConfig('');

    let error: Error | undefined;
    service.ensureValidToken().subscribe({ error: (err) => (error = err) });

    httpMock.expectNone(`${API_BASE_URL}/api/token`);
    expect(error?.message).toContain('API key');
  });
});
