import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';

@Injectable({ providedIn: 'root' })
export class ClientRepositoryImpl implements IClientRepository {
  constructor(private readonly http: HttpClient) {}
  private readonly baseUrl = `${environment.apiUrl}clients`;

  findById(id: string): Observable<Client> {
    return this.http
      .get<ResponseDTO<Client>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  findAll(): Observable<Client[]> {
    return this.http
      .get<ResponseDTO<Client[]>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }

  save(client: ClientRequestDTO): Observable<Client> {
    return this.http
      .post<ResponseDTO<Client>>(this.baseUrl, client)
      .pipe(map((response) => response.data));
  }

  update(id: string, client: Partial<ClientRequestDTO>): Observable<Client> {
    return this.http
      .put<ResponseDTO<Client>>(`${this.baseUrl}/${id}`, client)
      .pipe(map((response) => response.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.http
      .get<ResponseDTO<AuthenticatedClientResponseDto>>(
        `${this.baseUrl}/authenticated`
      )
      .pipe(map((response) => response.data));
  }

  getClientAds(): Observable<any[]> {
    return this.http
      .get<ResponseDTO<any[]>>(`${this.baseUrl}/ads-requests`)
      .pipe(map((r) => r.data));
  }

  getClientAttachments(): Observable<any[]> {
    return this.http
      .get<ResponseDTO<any[]>>(`${this.baseUrl}/attachments`)
      .pipe(map((r) => r.data));
  }
}


