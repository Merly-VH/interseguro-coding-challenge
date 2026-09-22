import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { RuntimeConfigService } from '../services/runtime-config.service';

// Adjunta el Bearer token solo a las llamadas hacia go-qr-api, salvo
// /api/token (el endpoint que lo emite). Cualquier otra request —como el
// config.json estático que lee RuntimeConfigService— pasa sin tocar, para
// no crear un ciclo (pedir el config requeriría un token, que requeriría
// el config...).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const runtimeConfig = inject(RuntimeConfigService);
  const targetsApi = req.url.startsWith(runtimeConfig.apiBaseUrl());
  if (!targetsApi || req.url.endsWith('/api/token')) {
    return next(req);
  }

  const authService = inject(AuthService);
  return authService
    .ensureValidToken()
    .pipe(
      switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
    );
};
