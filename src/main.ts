import { AppComponent } from '@app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { ConfirmationService, MessageService } from 'primeng/api';
import {  provideHttpClient, withInterceptors } from '@angular/common/http';
import { LOCALE_ID, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from '@app/app-routes.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { enUsLocale } from '@app/config/localizacao';
import { MyPreset } from '@app/config/tema';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { DialogService } from 'primeng/dynamicdialog';
import { environment } from './environments/environment';
import { ENVIRONMENT } from './environments/environment-token';
import { registerLocaleData } from '@angular/common';
import ptBr from '@angular/common/locales/pt';
import { errorInterceptor } from '@app/core/interceptor/error.interceptor';
import { loadingInterceptor } from '@app/core/interceptor/loading.interceptor';
import { authInterceptor } from '@app/core/interceptor/autenticacao.interceptor';
import { ToastService } from '@app/core/service/state/toast.service';

registerLocaleData(ptBr);
bootstrapApplication(AppComponent, {
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    provideHttpClient(withInterceptors([errorInterceptor, loadingInterceptor, authInterceptor])),

    importProvidersFrom(BrowserAnimationsModule),
    MessageService,
    ToastService,
    DialogService,
    ConfirmationService,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideRouter(appRoutes),
    providePrimeNG({
      theme: {
        preset: MyPreset,
      },
      translation: enUsLocale,
    }),
    provideEnvironmentNgxMask(),
  ],
});
