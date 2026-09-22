import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

interface RuntimeConfig {
  apiKey?: string;
}

// RuntimeConfigService lee /config.json, un archivo estático servido junto
// a la app. En Docker, docker-entrypoint.sh lo genera al arrancar el
// contenedor con la API_KEY del despliegue (ver frontend/README para el
// detalle) — así quien abre la página no necesita configurar nada. En
// desarrollo local (ng serve, sin Docker) el archivo trae la key vacía.
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly http = inject(HttpClient);
  private configuredApiKey$?: Observable<string>;

  getConfiguredApiKey(): Observable<string> {
    if (!this.configuredApiKey$) {
      this.configuredApiKey$ = this.http.get<RuntimeConfig>(`config.json?t=${Date.now()}`).pipe(
        map((config) => config.apiKey?.trim() ?? ''),
        catchError(() => of('')),
        shareReplay(1),
      );
    }
    return this.configuredApiKey$;
  }
}
