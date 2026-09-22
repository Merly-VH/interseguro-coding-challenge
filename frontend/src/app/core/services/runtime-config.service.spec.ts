import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DEFAULT_API_BASE_URL } from '../api-config';
import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let httpMock: HttpTestingController;

  function flushConfig(config: { apiKey?: string; apiBaseUrl?: string }): void {
    httpMock.expectOne((req) => req.url.startsWith('config.json')).flush(config);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RuntimeConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('empieza con el apiBaseUrl por defecto y ready en false', () => {
    expect(service.ready()).toBe(false);
    expect(service.apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(service.apiKey()).toBe('');
  });

  it('toma apiKey y apiBaseUrl recortados de config.json', () => {
    flushConfig({ apiKey: '  clave-docker  ', apiBaseUrl: '  https://api.onrender.com  ' });

    expect(service.apiKey()).toBe('clave-docker');
    expect(service.apiBaseUrl()).toBe('https://api.onrender.com');
    expect(service.ready()).toBe(true);
  });

  it('mantiene el apiBaseUrl por defecto si config.json no trae uno', () => {
    flushConfig({ apiKey: 'clave' });

    expect(service.apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(service.ready()).toBe(true);
  });

  it('marca ready aunque config.json no traiga nada', () => {
    flushConfig({});

    expect(service.apiKey()).toBe('');
    expect(service.apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(service.ready()).toBe(true);
  });

  it('marca ready aunque la request de red falle (no rompe la app)', () => {
    httpMock
      .expectOne((req) => req.url.startsWith('config.json'))
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(service.ready()).toBe(true);
    expect(service.apiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});
