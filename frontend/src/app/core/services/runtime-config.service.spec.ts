import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RuntimeConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('devuelve la apiKey recortada cuando config.json la trae', () => {
    let received: string | undefined;
    service.getConfiguredApiKey().subscribe((key) => (received = key));

    httpMock
      .expectOne((req) => req.url.startsWith('config.json'))
      .flush({ apiKey: '  clave-docker  ' });

    expect(received).toBe('clave-docker');
  });

  it('devuelve string vacío si config.json no trae apiKey', () => {
    let received: string | undefined;
    service.getConfiguredApiKey().subscribe((key) => (received = key));

    httpMock.expectOne((req) => req.url.startsWith('config.json')).flush({});

    expect(received).toBe('');
  });

  it('devuelve string vacío (no falla) si la request de red falla', () => {
    let received: string | undefined;
    let errored = false;
    service.getConfiguredApiKey().subscribe({
      next: (key) => (received = key),
      error: () => (errored = true),
    });

    httpMock
      .expectOne((req) => req.url.startsWith('config.json'))
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(errored).toBe(false);
    expect(received).toBe('');
  });

  it('cachea el resultado: una segunda suscripción no dispara otra request', () => {
    service.getConfiguredApiKey().subscribe();
    httpMock.expectOne((req) => req.url.startsWith('config.json')).flush({ apiKey: 'x' });

    let received: string | undefined;
    service.getConfiguredApiKey().subscribe((key) => (received = key));

    httpMock.expectNone((req) => req.url.startsWith('config.json'));
    expect(received).toBe('x');
  });
});
