import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Authentication } from '../service/auth/autenthication';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authentication: Authentication = inject(Authentication);
  const authToken = authentication.token;
  const router = inject(Router);
  const urlLogin = req.url.includes('login');

  if (urlLogin) {
    return next(req);
  }

  if (authToken) {
    if (!authentication.isTokenValido()) {
      authentication.removerAutenticacao();
      router.navigate(['/login']);
      return of();
    }

    const reqWithHeader = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + authToken)
    });

    return next(reqWithHeader);
  }

  return next(req);
}
