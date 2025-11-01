import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Client } from "@app/model/client";
import { SenhaRequestDto } from "@app/model/dto/request/senha-request.dto";
import { SenhaUpdate } from "@app/model/dto/request/senha-update.request";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { JwtHelperService } from "@auth0/angular-jwt";
import { catchError, map, Observable, switchMap, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthenticationStorage } from "../auth/authentication-storage";
import { ClientService } from "./client.service";

@Injectable({ providedIn: "root" })
export class AutenticacaoService {
  _userSignal = signal<Client | null>(null);
  _loggedClientSignal = signal<AuthenticatedClientResponseDto | null>(null);
  _helperJwt: JwtHelperService;
  get helperJwt() {
    const helper = this._helperJwt
      ? this._helperJwt
      : new JwtHelperService({
          tokenGetter: AuthenticationStorage.getToken(),
        });

    this._helperJwt = helper;
    return this._helperJwt;
  }

  nomeToken = AuthenticationStorage.storageName;
  userId: string;

  headers = {
    headers: {
      Authorization: `Bearer ${AuthenticationStorage.getToken()}`,
    },
  };
  httpBackend: HttpClient;

  private readonly url = environment.apiUrl + "auth/";

  storege = AuthenticationStorage;

  constructor(
    private readonly httpClient: HttpClient,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication
  ) {
    if (this.storege.getDataUser()) {
      const user = JSON.parse(this.storege.getDataUser());
      this._userSignal.set(user);
      // Notifica o serviço central de autenticação para centralizar o estado
      try {
        this.authentication.updateClientData(user as any);
      } catch (e) {
        // não bloquear a inicialização caso haja diferenças de shape
        console.warn("Falha ao sincronizar estado de autenticação inicial:", e);
      }
    }
  }

  public get token(): string {
    if (this.storege.getToken()) {
      return this.storege.getToken();
    }
    return null;
  }

  public get user(): Client | null {
    return this._userSignal();
  }

  public get loggedClient(): AuthenticatedClientResponseDto | null {
    return this._loggedClientSignal();
  }

  login(payload: {
    username: string;
    password: string;
  }): Observable<{ token: string; client: AuthenticatedClientResponseDto }> {
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
            // Notifica Authentication para evitar duplicação de requests
            try {
              this.authentication.updateClientData(client as any);
            } catch (e) {
              console.warn("Falha ao notificar Authentication após login:", e);
            }
          }),
          // Retorna um objeto com token e client para o caller
          map((client) => ({ token, client }))
        );
      }),
      catchError((error) => {
        console.error("Login process failed:", error.message || error);
        AuthenticationStorage.clearToken();
        this._loggedClientSignal.set(null);
        try {
          // garante que o estado central seja limpo caso tenhamos falha
          this.authentication.removerAutenticacao();
        } catch (e) {
          console.warn(
            "Falha ao notificar Authentication na falha do login:",
            e
          );
        }
        const friendlyError = new Error(
          "Invalid credentials. Please try again."
        );
        return throwError(() => friendlyError);
      })
    );
  }

  logout(): void {
    AuthenticationStorage.clearToken();
    this._userSignal.set(null);
    this._loggedClientSignal.set(null);
    try {
      this.authentication.removerAutenticacao();
    } catch (e) {
      console.warn("Falha ao notificar Authentication no logout:", e);
    }
  }

  recuperarSenha(login: string) {
    return this.httpClient.post(`${this.url}recovery-password/${login}`, {});
  }

  redefinirSenha(login: string, request: SenhaRequestDto) {
    return this.httpClient.patch<SenhaRequestDto>(
      `${this.url}reset-password/${login}`,
      request
    );
  }

  alterarSenha(request: SenhaUpdate): Observable<SenhaUpdate> {
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
    return this.httpBackend
      .post<{ data: { id_token: string } }>(`${this.url}/refresh-token`, {
        refresh_token: AuthenticationStorage.getRefreshToken(),
      })
      .pipe(
        map((response) => {
          AuthenticationStorage.setToken(response.data.id_token);
          return response;
        })
      );
  }
}
