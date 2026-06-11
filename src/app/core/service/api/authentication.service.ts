import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable, signal, Injector, inject, Optional } from "@angular/core";
import { Client } from "@app/model/client";
import { PasswordRequestDto } from "@app/model/dto/request/password-request.dto";
import { PasswordUpdateRequest } from "@app/model/dto/request/password-update.request";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { JwtHelperService } from "@auth0/angular-jwt";
import { HttpErrorResponse } from "@angular/common/http";
import {
  LoginFlowError,
  resolveLoginFlowError,
} from "@app/core/error/login-error.util";
import { catchError, map, Observable, switchMap, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthenticationStorage } from "../auth/authentication-storage";
import { ClientService } from "./client.service";
import { AuthService } from "../auth/auth.service";
import { Authentication } from "../auth/autenthication";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  private _authService?: AuthService;
  
  httpBackend: HttpClient;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly clientService: ClientService,
    private readonly injector: Injector,
    @Optional() private readonly authentication?: Authentication
  ) {
    this.httpBackend = new HttpClient(inject(HttpBackend));
  }

  private get authService(): AuthService | undefined {
    if (!this._authService) {
      try {
        this._authService = this.injector.get(AuthService, null);
      } catch {
        this._authService = undefined;
      }
    }
    return this._authService || undefined;
  }

  _userSignal = signal<Client | null>(null);
  _loggedClientSignal = signal<AuthenticatedClientResponseDto | null>(null);
  _helperJwt: JwtHelperService;
  
  get helperJwt() {
    if (this.authService) {
      return this.authService.helperJwt;
    }
    if (!this._helperJwt) {
      this._helperJwt = new JwtHelperService({
        tokenGetter: () => AuthenticationStorage.getToken() || ''
      });
    }
    return this._helperJwt;
  }

  nomeToken = AuthenticationStorage.storageName;
  userId: string;

  headers = {
    headers: {
      Authorization: `Bearer ${AuthenticationStorage.getToken()}`,
    },
  };

  private readonly url = environment.apiUrl + "auth/";

  storege = AuthenticationStorage;

  public get token(): string | null {
    if (this.authService) {
      return this.authService.token;
    }
    return AuthenticationStorage.getToken();
  }

  public get user(): Client | null {
    if (this.authService) {
      return this.authService.user;
    }
    return this._userSignal();
  }

  public get loggedClient(): AuthenticatedClientResponseDto | null {
    if (this.authService) {
      return this.authService.loggedClient;
    }
    return this._loggedClientSignal();
  }

  login(payload: {
    username: string;
    password: string;
  }): Observable<{ token: string; client: AuthenticatedClientResponseDto }> {
    if (this.authService) {
      return this.authService.login(payload) as Observable<{ token: string; client: AuthenticatedClientResponseDto }>;
    }
    return this.httpClient.post<any>(`${this.url}login`, payload).pipe(
      map((response) => {
        if (!response?.data) {
          throw new Error("Authentication token not received.");
        }
        return response.data;
      }),
      switchMap((token) => {
        AuthenticationStorage.setToken(token);

        return this.clientService.getAuthenticatedClient().pipe(
          tap((client) => {
            AuthenticationStorage.setDataUser(JSON.stringify(client));
            this._loggedClientSignal.set(client);
            this.clientService.setCurrentClient(client as Client);
            if (this.authentication) {
              this.authentication.updateClientData(client as Client);
            }
          }),
          map((client) => ({ token, client }))
        );
      }),
      catchError((error: unknown) => {
        AuthenticationStorage.clearToken();
        this._loggedClientSignal.set(null);
        if (error instanceof LoginFlowError) {
          return throwError(() => error);
        }
        if (error instanceof HttpErrorResponse) {
          return throwError(() => resolveLoginFlowError(error, "credentials"));
        }
        return throwError(() => resolveLoginFlowError(error, "credentials"));
      })
    );
  }

  logout(): void {
    if (this.authService) {
      this.authService.logout();
    } else {
      AuthenticationStorage.clearToken();
      this._userSignal.set(null);
      this._loggedClientSignal.set(null);
    }
  }

  recoverPassword(login: string): Observable<any> {
    if (this.authService) {
      return this.authService.recoverPassword(login);
    }
    return this.httpClient.post(`${this.url}recovery-password/${login}`, {});
  }

  resetPassword(login: string, request: PasswordRequestDto): Observable<any> {
    if (this.authService) {
      return this.authService.resetPassword(login, request);
    }
    return this.httpClient.patch<PasswordRequestDto>(
      `${this.url}reset-password/${login}`,
      request
    );
  }

  changePassword(request: PasswordUpdateRequest): Observable<void> {
    if (this.authService) {
      return this.authService.changePassword(request);
    }
    return this.httpClient.patch<void>(
      `${this.url}update-password`,
      request,
      {
        headers: {
          Authorization: `Bearer ${AuthenticationStorage.getToken()}`,
        },
      }
    );
  }

  refreshToken(): Observable<{ data: { id_token: string } }> {
    if (this.authService) {
      return this.authService.refreshToken().pipe(
        map(token => ({ data: { id_token: token } }))
      );
    }
    return this.httpBackend.post<{ data: { id_token: string } }>(`${this.url}/refresh-token`, {
      refresh_token: AuthenticationStorage.getRefreshToken()
    }).pipe(
      map((response) => {
        AuthenticationStorage.setToken(response.data.id_token);
        return response;
      })
    );
  }
}