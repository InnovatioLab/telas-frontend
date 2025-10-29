import { registerLocaleData } from "@angular/common";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import enUS from "@angular/common/locales/en";
import { LOCALE_ID, importProvidersFrom } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { appRoutes } from "@app/app-routes.routes";
import { AppComponent } from "@app/app.component";
import { enUsLocale } from "@app/config/localizacao";
import { MyPreset } from "@app/config/tema";
import { authInterceptor } from "@app/core/interceptor/autenticacao.interceptor";
import { errorInterceptor } from "@app/core/interceptor/error.interceptor";
import { loadingInterceptor } from "@app/core/interceptor/loading.interceptor";
import { ToastService } from "@app/core/service/state/toast.service";
import { CLIENT_REPOSITORY_TOKEN, ZIPCODE_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { ClientRepositoryImpl } from "@app/core/service/repository/client-repository.impl";
import { ZipCodeRepositoryImpl } from "@app/core/service/repository/zipcode-repository.impl";
import { provideEnvironmentNgxMask } from "ngx-mask";
import { ConfirmationService, MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { DialogService } from "primeng/dynamicdialog";
import { environment } from "./environments/environment";
import { ENVIRONMENT } from "./environments/environment-token";

registerLocaleData(enUS);
bootstrapApplication(AppComponent, {
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    { provide: CLIENT_REPOSITORY_TOKEN, useClass: ClientRepositoryImpl },
    { provide: ZIPCODE_REPOSITORY_TOKEN, useClass: ZipCodeRepositoryImpl },
    provideHttpClient(
      withInterceptors([errorInterceptor, loadingInterceptor, authInterceptor])
    ),

    importProvidersFrom(BrowserAnimationsModule),
    MessageService,
    ToastService,
    DialogService,
    ConfirmationService,
    { provide: LOCALE_ID, useValue: "en-US" },
    provideRouter(
      appRoutes,
      withInMemoryScrolling({
        scrollPositionRestoration: "top",
        anchorScrolling: "enabled",
      })
    ),
    providePrimeNG({
      theme: {
        preset: MyPreset,
      },
      translation: enUsLocale,
    }),
    provideEnvironmentNgxMask(),
  ],
});
