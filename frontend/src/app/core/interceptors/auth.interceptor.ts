import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

// Adjunta el Bearer token solo a llamadas HTTP absolutas (http:// o
// https://) hacia go-qr-api, salvo /api/token (el endpoint que lo emite).
// Las peticiones relativas —como config.json, que lee RuntimeConfigService—
// pasan sin tocar. Importante: no inyectamos RuntimeConfigService acá para
// decidir esto (aunque tengamos la URL real disponible ahí), porque la
// propia petición que ese servicio hace para leer config.json pasa por
// este interceptor — inyectarlo acá crearía una dependencia circular
// (RuntimeConfigService no termina de construirse hasta que su petición
// resuelve, y esa petición pasaría por un interceptor que necesita
// RuntimeConfigService ya construido).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsoluteRequest = /^https?:\/\//i.test(req.url);
  if (!isAbsoluteRequest || req.url.endsWith('/api/token')) {
    return next(req);
  }

  const authService = inject(AuthService);
  return authService
    .ensureValidToken()
    .pipe(
      switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
    );
};
