import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpStatusCode,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from "primeng/dynamicdialog";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthenticationService } from "../service/api/authentication.service";
import { ToastService } from "../service/state/toast.service";
import { ApiErrorHandler } from "../error/api-error-handler";

export function errorInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const dialogService = inject(DialogService);
  const router = inject(Router);
  const autenticacaoService = inject(AuthenticationService);
  const toastService = inject(ToastService);

  let configDialogo: DynamicDialogConfig;
  let refDialog: DynamicDialogRef | undefined;
  const rotaLogin = "token";

  return next(req).pipe(
    catchError((httpError: HttpErrorResponse) => {
      const { error, status, url } = httpError;
      const ignorarToastErro =
        req.headers.get("Ignorar-Error-Interceptor") === "true";
      const isAuthLoginRequest = req.url.includes("auth/login");

      if (isAuthLoginRequest) {
        return throwError(() => httpError);
      }

      if (status === HttpStatusCode.Unauthorized && !url?.includes(rotaLogin)) {
        const errorMessage = error?.detail ?? "Unauthorized access. Please log in again.";
        configDialogo = DialogUtils.showAlert(errorMessage, {
          primaryActionCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout();
            router.navigate(["/login"]);
          },
        });
        refDialog = dialogService.open(DialogComponent, configDialogo);
        return throwError(() => new Error(errorMessage));
      }

      if (status === HttpStatusCode.Unauthorized && url?.includes(rotaLogin)) {
        const errorMessage = "Invalid data! Please review and try again.";
        configDialogo = DialogUtils.showAlert(errorMessage, {
          primaryActionCallback: () => {
            refDialog?.destroy();
            autenticacaoService.logout();
            router.navigate(["/login"]);
          },
        });
        refDialog = dialogService.open(DialogComponent, configDialogo);
        return throwError(() => new Error(errorMessage));
      }

      const errorMessage = ApiErrorHandler.handleApiError(httpError);

      if (!ignorarToastErro) {
        if (status === HttpStatusCode.Forbidden) {
          if (errorMessage === ApiErrorHandler.GENERIC_FORBIDDEN_MESSAGE) {
            toastService.warn(errorMessage);
          } else {
            toastService.error(errorMessage);
          }
          return throwError(() => {
            const customError = new Error(errorMessage);
            (customError as any).handled = true;
            return customError;
          });
        }

        if (status === 0) {
          toastService.error(errorMessage);
        } else if (status >= 500) {
          toastService.error(errorMessage);
        } else if (status >= 400 && status !== HttpStatusCode.Unauthorized) {
          toastService.warn(errorMessage);
        }

        return throwError(() => new Error(errorMessage));
      }

      return throwError(() => httpError);
    })
  );
}
