import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { TokenResponse } from '../models/qr-response.model';
import { RuntimeConfigService } from './runtime-config.service';

// Margen de seguridad antes de la expiracion real para renovar el token con
// anticipacion y evitar que una request en curso lo vea expirar a mitad de camino.
const EXPIRY_SAFETY_MARGIN_MS = 10_000;

// AuthService resuelve la API key en este orden: 1) la que haya seteado el
// usuario a mano (manualApiKey), 2) la que venga del despliegue via
// RuntimeConfigService. Al ser ambos signals, `apiKey` se recalcula solo
// (computed), sin necesidad de sincronizar nada a mano. El JWT se guarda
// solo en memoria (nunca localStorage): se pierde al refrescar la página
// a propósito.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  private readonly manualApiKey = signal('');

  readonly apiKey = computed(() => this.manualApiKey() || this.runtimeConfig.apiKey());
  /** true una vez que se intentó leer la API key del despliegue (config.json), haya o no traído valor. */
  readonly configChecked = this.runtimeConfig.ready;
  /** true si la API key en uso vino del despliegue (Docker), no de que el usuario la haya tipeado. */
  readonly hasConfiguredKey = computed(() => !this.manualApiKey() && !!this.runtimeConfig.apiKey());

  private token: string | null = null;
  private tokenExpiresAt = 0;

  setApiKey(key: string): void {
    this.manualApiKey.set(key.trim());
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  /** Devuelve un token vigente, reutilizando el actual si todavía no expiró. */
  ensureValidToken(): Observable<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - EXPIRY_SAFETY_MARGIN_MS) {
      return of(this.token);
    }

    const key = this.apiKey();
    if (!key) {
      return throwError(() => new Error('Ingresá tu API key antes de continuar.'));
    }

    return this.http
      .post<TokenResponse>(`${this.runtimeConfig.apiBaseUrl()}/api/token`, null, {
        headers: { 'X-Api-Key': key },
      })
      .pipe(
        tap((res) => {
          this.token = res.token;
          this.tokenExpiresAt = Date.now() + res.expiresIn * 1000;
        }),
        map((res) => res.token),
        catchError((err) => {
          this.token = null;
          this.tokenExpiresAt = 0;
          return throwError(() => err);
        }),
      );
  }
}
