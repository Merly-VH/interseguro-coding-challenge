import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { QrResponse } from '../models/qr-response.model';
import { RuntimeConfigService } from './runtime-config.service';

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  computeQr(matrix: number[][]): Observable<QrResponse> {
    return this.http.post<QrResponse>(`${this.runtimeConfig.apiBaseUrl()}/api/qr`, { matrix });
  }
}
