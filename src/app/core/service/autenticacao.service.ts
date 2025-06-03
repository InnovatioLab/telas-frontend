import { JwtHelperService } from '@auth0/angular-jwt';
import { firstValueFrom, map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import * as jwt_decode from 'jwt-decode';
import { AutenticacaoStorage } from './guard';
import { Client } from '@app/model/client';
import { DecodedToken } from '@app/model/dto/response/decoded-token';
import { AuthenticationStorage } from './authentication-storage';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { ClientService } from './client.service';

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  _userSignal = signal<Client | null>(null);
  _helperJwt: JwtHelperService;
  get helperJwt() {
    const helper = this._helperJwt
      ? this._helperJwt
      : new JwtHelperService({
          tokenGetter: AutenticacaoStorage.getToken()
        });

    this._helperJwt = helper;
    return this._helperJwt;
  }

  nomeToken = AutenticacaoStorage.storageName;
  userId: string;

  headers = {
    headers: {
      Authorization: `Bearer ${AutenticacaoStorage.getToken()}`
    }
  };
  httpBackend: HttpClient;

  private readonly url = environment.urlApi;

  storege = AutenticacaoStorage

  constructor(
    private readonly httpClient: HttpClient,
    private readonly clientService: ClientService,
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

  login(payload: { username: string; password: string }): Observable<any> {
    return this.httpClient.post<{ data: string }>(`${this.url}/login`, payload)
      .pipe(
        map((response) => {
          if (!response?.data) {
            throw new Error('O token recebido não é válido.');
          }
          try {
            const token = response.data;
            const decodedToken: DecodedToken = jwt_decode.jwtDecode(token);
            AuthenticationStorage.setToken(token);
            AuthenticationStorage.setDataUser(JSON.stringify({
              id: decodedToken.id,
              identificationNumber: decodedToken.identificationNumber,
              businessName: decodedToken.businessName
            }));

            return response;
          } catch (error) {
            console.error('Erro ao decodificar o token JWT:', error);
            throw new Error('Erro ao decodificar o token JWT.');
          }
        })
      );
  }

  logout(): void {
    AuthenticationStorage.clearToken();
  }

  recuperarSenha(login: string) {
    return this.httpClient.post(`${this.url}/recover-password/${login}`, {});
  }

  redefinirSenha(login: string, request: SenhaRequestDto) {
    return this.httpClient.patch<SenhaRequestDto>(`${this.url}/reset-password/${login}`, request);
  }

  atualizarToken(): Observable<{ data: { id_token: string } }> {
    return this.httpBackend
      .post<{ data: { id_token: string } }>(`${this.url}/refresh-token`, {
        refresh_token: AuthenticationStorage.getRefreshToken()
      })
      .pipe(
        map(response => {
          AuthenticationStorage.setToken(response.data.id_token);
          return response;
        })
      );
  }
}
