import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
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
    private readonly clientService: ClientService
  ) {
    if (this.storege.getDataUser()) {
      const user = JSON.parse(this.storege.getDataUser());
      this._userSignal.set(user);
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

  // login(payload: { username: string; password: string }): Observable<any> {
  //   return this.httpClient
  //     .post<{ data: string }>(`${this.url}login`, payload)
  //     .pipe(
  //       map((response) => {
  //         if (!response?.data) {
  //           throw new Error("Invalid token received.");
  //         }
  //         const token = response.data;
  //         let decodedToken: DecodedToken;
  //         try {
  //           decodedToken = jwt_decode.jwtDecode(token);
  //         } catch (error) {
  //           console.error("Error While decoding JWT token:", error);
  //           throw new Error("Error While decoding JWT token.");
  //         }
  //         AuthenticationStorage.setToken(token);
  //         return decodedToken.id;
  //       }),
  //       switchMap((userId: string) =>
  //         this.clientService.getAuthenticatedClient().pipe(
  //           map((client) => {
  //             AuthenticationStorage.setDataUser(JSON.stringify(client));
  //             this._loggedClientSignal.set(client);
  //             return userId;
  //           })
  //         )
  //       )
  //     );
  // }

  login(payload: { username: string; password: string }): Observable<any> {
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
          }),
          map(() => token)
        );
      }),
      catchError((error) => {
        console.error("Login process failed:", error.message || error);
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
    AuthenticationStorage.clearToken();
    this._userSignal.set(null);
    this._loggedClientSignal.set(null);
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
