import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import { LoadingService } from '../service/loading.service';

export function loadingInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const _loading = inject(LoadingService);

  const ignorarCarregamento = req.headers.has('Ignorar-Loading-Interceptor') || req.method === 'GET';

  if (!ignorarCarregamento) {
    _loading.setLoading(true, req.url);
  }

  return next(req).pipe(
    map((event: HttpEvent<unknown>) => {
      if (!ignorarCarregamento && event instanceof HttpResponse) {
        _loading.setLoading(false, req.url);
      }
      return event;
    }),
    finalize(() => {
      if (!ignorarCarregamento) {
        _loading.setLoading(false, req.url);
      }
    })
  );
}
