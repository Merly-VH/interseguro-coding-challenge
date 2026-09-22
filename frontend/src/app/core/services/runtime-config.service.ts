import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { DEFAULT_API_BASE_URL } from '../api-config';

interface RuntimeConfig {
  apiKey?: string;
  apiBaseUrl?: string;
}

// RuntimeConfigService lee /config.json, un archivo estático servido junto
// a la app, con los valores que dependen de dónde se desplegó (la API key
// y la URL de go-qr-api). En Docker/Render, docker-entrypoint.sh lo genera
// al arrancar el contenedor a partir de las variables de entorno del
// despliegue (API_KEY, API_BASE_URL) — así quien abre la página no
// necesita configurar nada. En desarrollo local (ng serve, sin Docker) el
// archivo trae los campos vacíos y se usan los valores por defecto.
@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly http = inject(HttpClient);

  /** true una vez que se intentó leer config.json, haya o no traído valores. */
  readonly ready = signal(false);
  /** API key del despliegue, vacía si no vino configurada. */
  readonly apiKey = signal('');
  /** URL base de go-qr-api; DEFAULT_API_BASE_URL hasta que config.json resuelva (o si no trae una). */
  readonly apiBaseUrl = signal(DEFAULT_API_BASE_URL);

  constructor() {
    this.http
      .get<RuntimeConfig>(`config.json?t=${Date.now()}`)
      .pipe(catchError(() => of<RuntimeConfig>({})))
      .subscribe((config) => {
        if (config.apiKey?.trim()) {
          this.apiKey.set(config.apiKey.trim());
        }
        if (config.apiBaseUrl?.trim()) {
          this.apiBaseUrl.set(config.apiBaseUrl.trim());
        }
        this.ready.set(true);
      });
  }
}
