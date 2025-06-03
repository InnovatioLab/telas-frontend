import { HttpClient, HttpParams, HttpBackend } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { Client } from '@app/model/client';
import { BaseHttpService } from './base-htttp.service';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ClientResponseDTO } from '@app/model/dto/response/client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';

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

  protected httpClient: HttpClient;
  protected baseUrl: string;

  constructor() {
    const http = inject(HttpClient);
    const baseUrl = inject(ENVIRONMENT).apiUrl + 'clients';
    super(http, baseUrl);
    this.httpClient = http;
    this.baseUrl = baseUrl;
  }

  save(perfil: ClientRequestDTO, ignorarLoading = false) {
    const deveIgnorarLoading = ignorarLoading ? { 'Ignorar-Loading-Interceptor': 'true' } : {};
    return this.httpClient.post(`${this.baseUrl}`,
      perfil,
      { headers: {
        ...deveIgnorarLoading,
    }});
  }

  editar(id: string, perfil: ClientRequestDTO) {
    return this.httpClient.put<SenhaRequestDto>(`${this.baseUrl}/${id}`, perfil);
  }

  criarSenha(login: string, request: SenhaRequestDto) {
    return this.httpClient.patch<SenhaRequestDto>(`${this.baseUrl}/create-password/${login}`, request);
  }

  atualizardadosPerfil(id: string, client: ClientRequestDTO) {
    return this.httpClient.put(`${this.baseUrl}/${id}`, client, this.headers);
  }

  reenvioCodigo(login: string) {
    return this.httpClient.post(`${this.baseUrl}/resend-code/${login}`, {});
  }

  validarCodigo(login: string, code: string) {
    const params = new HttpParams().set('code', code);
    return this.httpClient.patch(`${this.baseUrl}/validate-code/${login}`, null, { params });
  }

  aceitarTermosDeCondicao() {
    return this.httpClient.patch(`${this.baseUrl}/accept-terms-conditions`, null, this.headers);
  }

  clientExistente(login: string): Observable<ClientResponseDTO> {
    return this.httpClient
      .get<ResponseDTO<ClientResponseDTO>>(`${this.baseUrl}/identification/${login}`)
      .pipe(map((data: ResponseDTO<ClientResponseDTO>) => data.data));
  }

  buscarClient<T>(idOuUID: string): Observable<T> {
    if (!idOuUID) {
      console.error('ID/UUID não fornecido para busca de usuário');
      throw new Error('ID/UUID não fornecido');
    }
    
    console.log(`Buscando cliente com ID/UUID: ${idOuUID}`);
    
    return this.httpClient.get<ResponseDTO<T>>(`${this.baseUrl}/${idOuUID}`).pipe(
      map((response: ResponseDTO<T>) => {
        if (response?.data === undefined) {
          console.error('Resposta da API inválida:', response);
          throw new Error('Dados do usuário não encontrados');
        }
        console.log('Dados do cliente recebidos com sucesso');
        return response.data;
      })
    );
  }
}
