import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AutenticacaoService } from '../service/api/autenticacao.service';

export function errorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const dialogService = inject(DialogService);
  const router = inject(Router);
  const autenticacaoService = inject(AutenticacaoService);

  let configDialogo: DynamicDialogConfig;
  let refDialog: DynamicDialogRef | undefined;
  const rotaLogin = 'token';
  
  return next(req).pipe(
    catchError(({ error, status, url }: HttpErrorResponse) => {
      if (status === HttpStatusCode.Unauthorized && !url?.includes(rotaLogin)) {
        configDialogo = DialogoUtils.exibirAlerta(error?.detail ?? 'Unauthorized access. Please log in again.', {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout()
            router.navigate(['/login']);
          }
        });
      }

      if (status === HttpStatusCode.Unauthorized && url?.includes(rotaLogin)) {
        configDialogo = DialogoUtils.exibirAlerta('Invalid data! Please review and try again.', {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout()
            router.navigate(['/login']);
          }
        });
      }

      if (configDialogo) {
        refDialog = dialogService.open(DialogoComponent, configDialogo);
      }

      let errorMessage = 'An error occurred';
      
      if (error?.mensagem) {
        errorMessage = error.mensagem;
      } else if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0];
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      return throwError(() => new Error(errorMessage));
    })
  );
}
