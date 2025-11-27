import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpStatusCode,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from "primeng/dynamicdialog";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AutenticacaoService } from "../service/api/autenticacao.service";
import { ToastService } from "../service/state/toast.service";
import { ApiErrorHandler } from "../error/api-error-handler";

export function errorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const dialogService = inject(DialogService);
  const router = inject(Router);
  const autenticacaoService = inject(AutenticacaoService);
  const toastService = inject(ToastService);

  let configDialogo: DynamicDialogConfig;
  let refDialog: DynamicDialogRef | undefined;
  const rotaLogin = "token";

  return next(req).pipe(
    catchError((httpError: HttpErrorResponse) => {
      const { error, status, url } = httpError;

      if (status === HttpStatusCode.Unauthorized && !url?.includes(rotaLogin)) {
        const errorMessage = error?.detail ?? "Unauthorized access. Please log in again.";
        configDialogo = DialogoUtils.exibirAlerta(errorMessage, {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout();
            router.navigate(["/login"]);
          },
        });
        refDialog = dialogService.open(DialogoComponent, configDialogo);
        return throwError(() => new Error(errorMessage));
      }

      if (status === HttpStatusCode.Unauthorized && url?.includes(rotaLogin)) {
        const errorMessage = "Invalid data! Please review and try again.";
        configDialogo = DialogoUtils.exibirAlerta(errorMessage, {
          acaoPrimariaCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout();
            router.navigate(["/login"]);
          },
        });
        refDialog = dialogService.open(DialogoComponent, configDialogo);
        return throwError(() => new Error(errorMessage));
      }

      const errorMessage = ApiErrorHandler.handleApiError(httpError);
      
      if (status === HttpStatusCode.Forbidden) {
        toastService.aviso(errorMessage);
        return throwError(() => {
          const customError = new Error(errorMessage);
          (customError as any).handled = true;
          return customError;
        });
      }
      
      if (status >= 500) {
        toastService.erro(errorMessage);
      } else if (status >= 400 && status !== HttpStatusCode.Unauthorized) {
        toastService.aviso(errorMessage);
      }

      return throwError(() => new Error(errorMessage));
    })
  );
}
