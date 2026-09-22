import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { QrResponse } from '../../core/models/qr-response.model';
import { QrService } from '../../core/services/qr.service';
import { QrCalculatorComponent } from './qr-calculator.component';

describe('QrCalculatorComponent', () => {
  const sampleResponse: QrResponse = {
    q: [
      [1, 0],
      [0, 1],
    ],
    r: [
      [2, 0],
      [0, 3],
    ],
    stats: { max: 3, min: 0, sum: 6, average: 1.5, diagonal: { q: true, r: true } },
  };

  let httpMock: HttpTestingController;

  function create(qrServiceStub: Partial<QrService>) {
    TestBed.configureTestingModule({
      imports: [QrCalculatorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: QrService, useValue: qrServiceStub },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(QrCalculatorComponent);

    // AuthService pide config.json al construirse; en estos tests no hay
    // Docker de por medio, así que responde sin apiKey y el test la setea a mano.
    httpMock.expectOne((req) => req.url.startsWith('config.json')).flush({});
    TestBed.inject(AuthService).setApiKey('clave-de-prueba');

    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => httpMock.verify());

  it('muestra el resultado cuando el cálculo tiene éxito', () => {
    const fixture = create({ computeQr: () => of(sampleResponse) });
    fixture.componentInstance.calculate();

    expect(fixture.componentInstance.result()).toEqual(sampleResponse);
    expect(fixture.componentInstance.errorMessage()).toBeNull();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('muestra el mensaje de error que devuelve el backend', () => {
    const backendError = new HttpErrorResponse({
      status: 400,
      error: { error: 'matriz no rectangular' },
    });
    const fixture = create({ computeQr: () => throwError(() => backendError) });
    fixture.componentInstance.calculate();

    expect(fixture.componentInstance.errorMessage()).toBe('matriz no rectangular');
    expect(fixture.componentInstance.result()).toBeNull();
  });

  it('pide la API key antes de llamar al backend si falta', () => {
    const fixture = create({ computeQr: () => of(sampleResponse) });
    TestBed.inject(AuthService).setApiKey('');

    fixture.componentInstance.calculate();

    expect(fixture.componentInstance.errorMessage()).toContain('API key');
    expect(fixture.componentInstance.result()).toBeNull();
  });
});
