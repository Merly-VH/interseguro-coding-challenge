import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { QrResponse } from '../models/qr-response.model';

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly http = inject(HttpClient);

  computeQr(matrix: number[][]): Observable<QrResponse> {
    return this.http.post<QrResponse>(`${API_BASE_URL}/api/qr`, { matrix });
  }
}
