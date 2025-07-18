import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ClientResponseDTO } from '@app/model/dto/response/client-response.dto';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { BaseHttpService } from './base-htttp.service';

@Injectable({ providedIn: 'root' })
export class ClientService extends BaseHttpService<Client> {
  storageName = 'telas_token';
  token = localStorage.getItem(this.storageName);
  httpBackend = new HttpClient(inject(HttpBackend));
  private readonly autenticado = { Authorization: `Bearer ${this.token}` };
  private readonly ignorarLoadingInterceptor = { 'Ignorar-Loading-Interceptor': 'true' };
  private readonly ignorarErrorInterceptor = { 'Ignorar-Error-Interceptor': 'true' };

  cancelarEdicao$: Subject<boolean> = new Subject<boolean>();

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`
    }
  };

  protected baseUrl: string;

  public clientAtual$ = new BehaviorSubject<Client | null>(null);

  constructor() {
    const http = inject(HttpClient);
    super(http, 'clients');
    this.baseUrl = this.url;
  }

  save(perfil: ClientRequestDTO, ignorarLoading = false) {
    const deveIgnorarLoading = ignorarLoading ? { 'Ignorar-Loading-Interceptor': 'true' } : {};
    return this.http.post(`${this.baseUrl}`,
      perfil,
      { headers: {
        ...deveIgnorarLoading,
    }});
  }

  editar(id: string, perfil: ClientRequestDTO) {
    return this.http.put<SenhaRequestDto>(`${this.baseUrl}/${id}`, perfil);
  }

  criarSenha(login: string, request: SenhaRequestDto) {
    return this.http.patch<SenhaRequestDto>(`${this.baseUrl}/create-password/${login}`, request);
  }

  atualizardadosPerfil(id: string, client: ClientRequestDTO) {
    return this.http.put(`${this.baseUrl}/${id}`, client, this.headers);
  }

  reenvioCodigo(login: string) {
    return this.http.post(`${this.baseUrl}/resend-code/${login}`, {});
  }

  validarCodigo(login: string, code: string) {
    const params = new HttpParams().set('code', code);
    return this.http.patch(`${this.baseUrl}/validate-code/${login}`, null, { params });
  }

  aceitarTermosDeCondicao() {
    return this.http.patch(`${this.baseUrl}/accept-terms-conditions`, null, this.headers);
  }

  clientExistente(login: string): Observable<ClientResponseDTO> {
    return this.http
      .get<ResponseDTO<ClientResponseDTO>>(`${this.baseUrl}/identification/${login}`)
      .pipe(map((data: ResponseDTO<ClientResponseDTO>) => data.data));
  }

  buscarClient<T>(idOuUID: string): Observable<T> {
    if (!idOuUID) {
      console.error('ID/UUID não fornecido para busca de usuário');
      throw new Error('ID/UUID não fornecido');
    }
    return this.http.get<ResponseDTO<T>>(`${this.baseUrl}/${idOuUID}`).pipe(
      map((response: ResponseDTO<T>) => {
        if (response?.data === undefined) {
          console.error('Resposta da API inválida:', response);
          throw new Error('Dados do usuário não encontrados');
        }
        return response.data;
      })
    );
  }

  buscaClientPorIdentificador<T>(identificador: string): Observable<ClientResponseDTO> {
    if (!identificador) {
      console.error('Identificador não fornecido para busca de usuário');
      throw new Error('Identificador não fornecido');
    }
    return this.http.get<ResponseDTO<ClientResponseDTO>>(`${this.baseUrl}/identification/${identificador}`).pipe(
      map((response: ResponseDTO<ClientResponseDTO>) => {
        if (response?.data === undefined) {
          console.error('Resposta da API inválida:', response);
          throw new Error('Dados do usuário não encontrados');
        }
        return response.data;
      })
    );
  }

  setClientAtual(client: Client | null) {
    this.clientAtual$.next(client);
    if (client) {
      localStorage.setItem('telas_token_user', JSON.stringify(client));
    }
  }

  getClientAtual(): Client | null {
    return this.clientAtual$.getValue();
  }
}