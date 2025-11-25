import { HttpClient, HttpBackend } from "@angular/common/http";
import { Injectable, signal, Injector, inject, Optional } from "@angular/core";
import { Client } from "@app/model/client";
import { SenhaRequestDto } from "@app/model/dto/request/senha-request.dto";
import { SenhaUpdate } from "@app/model/dto/request/senha-update.request";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { JwtHelperService } from "@auth0/angular-jwt";
import { catchError, map, Observable, switchMap, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthenticationStorage } from "../auth/authentication-storage";
import { ClientService } from "./client.service";
import { AuthService } from "../auth/auth.service";
import { Authentication } from "../auth/autenthication";

@Injectable({ providedIn: "root" })
export class AutenticacaoService {
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
            this.clientService.setClientAtual(client as Client);
            if (this.authentication) {
              this.authentication.updateClientData(client as Client);
            }
          }),
          map((client) => ({ token, client }))
        );
      }),
      catchError((error: any) => {
        AuthenticationStorage.clearToken();
        this._loggedClientSignal.set(null);
        const friendlyError = new Error(
          "Invalid credentials. Please try again."
        );
        return throwError(() => friendlyError);
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

  recuperarSenha(login: string): Observable<any> {
    if (this.authService) {
      return this.authService.recuperarSenha(login);
    }
    return this.httpClient.post(`${this.url}recovery-password/${login}`, {});
  }

  redefinirSenha(login: string, request: SenhaRequestDto): Observable<any> {
    if (this.authService) {
      return this.authService.redefinirSenha(login, request);
    }
    return this.httpClient.patch<SenhaRequestDto>(
      `${this.url}reset-password/${login}`,
      request
    );
  }

  alterarSenha(request: SenhaUpdate): Observable<SenhaUpdate> {
    if (this.authService) {
      return this.authService.alterarSenha(request);
    }
    return this.httpClient.patch<SenhaUpdate>(
      `${this.url}update-password`,
      request,
      {
        headers: {
          Authorization: `Bearer ${AuthenticationStorage.getToken()}`,
        },
      }
    );
  }

  atualizarToken(): Observable<{ data: { id_token: string } }> {
    if (this.authService) {
      return this.authService.atualizarToken();
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