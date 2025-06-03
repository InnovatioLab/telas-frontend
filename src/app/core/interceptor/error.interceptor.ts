import { HttpHandlerFn, HttpRequest, HttpErrorResponse, HttpEvent, HttpStatusCode } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Router } from '@angular/router';
import { DialogoUtils } from '@app/shared/utils/dialogo-config.utils';
import { DialogoComponent } from '@app/shared/components/dialogo/dialogo.component';
import { AutenticacaoService } from '../service/autenticacao.service';

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
        configDialogo = DialogoUtils.exibirAlerta(error?.detail, {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout()
            router.navigate(['/login']);
          }
        });

      }

      if (status === HttpStatusCode.Unauthorized && url?.includes(rotaLogin)) {
        configDialogo = DialogoUtils.exibirAlerta('Dados inválidos! Revise e tente novamente.', {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout()
            router.navigate(['/login']);
          }
        });
      }

      refDialog = dialogService.open(DialogoComponent, configDialogo);

      return throwError(() => new Error(error?.mensagem ?? error?.errors?.[0]));
    })
  );
}
