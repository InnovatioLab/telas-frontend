import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of, from, switchMap } from 'rxjs';
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { ClientResponseDTO } from '@app/model/dto/response/client-response.dto';
import { Page } from '@app/model/dto/page.dto';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { AdRequestResponseDto, PendingAdAdminValidationResponseDto } from '@app/model/dto/response/ad-request-response.dto';
import { WishlistResponseDto } from '@app/model/dto/response/wishlist-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { AttachmentRequestDto } from '@app/model/dto/request/attachment-request.dto';
import { ClientAdRequestDto } from '@app/model/dto/request/client-ad-request.dto';
import { RefusedAdRequestDto } from '@app/model/dto/request/refused-ad-request.dto';
import { FilterClientRequestDto } from '@app/core/service/api/client-management.service';
import { BaseRepository } from './base.repository';

@Injectable({ providedIn: 'root' })
export class ClientRepositoryImpl extends BaseRepository<Client, ClientRequestDTO, Partial<ClientRequestDTO>> implements IClientRepository {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'clients');
  }

  override delete(id: string): Observable<boolean> {
    return super.delete(id);
  }

  save(client: ClientRequestDTO): Observable<Client> {
    return this.create(client);
  }

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.http
      .get<ResponseDTO<AuthenticatedClientResponseDto>>(
        `${this.baseUrl}/authenticated`,
        this.getHeaders()
      )
      .pipe(map((response) => response.data));
  }

  getClientAds(): Observable<any[]> {
    return this.http
      .get<ResponseDTO<any[]>>(`${this.baseUrl}/ads-requests`, this.getHeaders())
      .pipe(map((r) => r.data));
  }

  getClientAttachments(): Observable<any[]> {
    return this.http
      .get<ResponseDTO<any[]>>(`${this.baseUrl}/attachments`, this.getHeaders())
      .pipe(map((r) => r.data));
  }

  saveWithLoadingOption(client: ClientRequestDTO, ignorarLoading = false): Observable<any> {
    const headers = ignorarLoading
      ? { ...this.getHeaders(), headers: this.getHeaders().headers.set('Ignorar-Loading-Interceptor', 'true') }
      : this.getHeaders();
    return this.http.post(`${this.baseUrl}`, client, headers);
  }

  editar(id: string, client: ClientRequestDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, client, this.getHeaders());
  }

  criarSenha(login: string, request: SenhaRequestDto): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/create-password/${login}`,
      request,
      this.getHeaders()
    );
  }

  atualizardadosPerfil(id: string, client: ClientRequestDTO): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, client, this.getHeaders());
  }

  reenvioCodigo(login: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/resend-code/${login}`, {}, this.getHeaders());
  }

  validarCodigo(login: string, code: string): Observable<any> {
    const params = new HttpParams().set('code', code);
    return this.http.patch(
      `${this.baseUrl}/validate-code/${login}`,
      {},
      { ...this.getHeaders(), params }
    );
  }

  aceitarTermosDeCondicao(): Observable<any> {
    return this.http.patch(
      `${this.baseUrl}/accept-terms-conditions`,
      null,
      this.getHeaders()
    );
  }

  clientExistente(email: string): Observable<ClientResponseDTO> {
    return this.http
      .get<ResponseDTO<ClientResponseDTO>>(`${this.baseUrl}/identification/${email}`, this.getHeaders())
      .pipe(map((response) => response.data));
  }

  buscarClient<T>(idOuUID: string): Observable<T> {
    if (!idOuUID) {
      throw new Error('ID/UUID não fornecido');
    }
    return this.http.get<ResponseDTO<T>>(`${this.baseUrl}/${idOuUID}`, this.getHeaders()).pipe(
      map((response: ResponseDTO<T>) => {
        if (response?.data === undefined) {
          throw new Error('Dados do usuário não encontrados');
        }
        return response.data;
      })
    );
  }

  buscaClientPorIdentificador(email: string): Observable<ClientResponseDTO> {
    if (!email) {
      throw new Error('Email not provided');
    }
    return this.http
      .get<ResponseDTO<ClientResponseDTO>>(`${this.baseUrl}/identification/${email}`, this.getHeaders())
      .pipe(
        map((response: ResponseDTO<ClientResponseDTO>) => {
          if (response?.data === undefined) {
            throw new Error('User data not found');
          }
          return response.data;
        })
      );
  }

  getAllAds(page: number = 1, size: number = 10): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/ads-requests`, { ...this.getHeaders(), params })
      .pipe(map((response) => response.data));
  }

  getAllAdRequests(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<AdRequestResponseDto>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
      if (filters.includeInactiveRequests) {
        params = params.set('includeInactiveRequests', 'true');
      }
    }

    params = params.set('_t', Date.now().toString());

    return this.http
      .get<ResponseDTO<PaginationResponseDto<AdRequestResponseDto>>>(
        `${this.baseUrl}/ads-requests`,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response) => {
          if (response.data) {
            return {
              list: response.data.list,
              totalElements:
                response.data.totalElements && response.data.totalElements > 0
                  ? response.data.totalElements
                  : response.data.list.length,
              totalPages: response.data.totalPages || 0,
              currentPage: response.data.currentPage || 0,
              size: response.data.size || 0,
              hasNext: response.data.hasNext || false,
              hasPrevious: response.data.hasPrevious || false,
            };
          }
          return {
            list: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 0,
            hasNext: false,
            hasPrevious: false,
          };
        })
      );
  }

  getPendingAds(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<PendingAdAdminValidationResponseDto>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
    }

    params = params.set('_t', Date.now().toString());

    return this.http
      .get<ResponseDTO<PaginationResponseDto<PendingAdAdminValidationResponseDto>>>(
        `${this.baseUrl}/pending-ads`,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response: ResponseDTO<PaginationResponseDto<PendingAdAdminValidationResponseDto>>) => {
          if (response.data) {
            return {
              list: response.data.list,
              totalElements:
                response.data.totalElements && response.data.totalElements > 0
                  ? response.data.totalElements
                  : response.data.list.length,
              totalPages: response.data.totalPages || 0,
              currentPage: response.data.currentPage || 0,
              size: response.data.size || 0,
              hasNext: response.data.hasNext || false,
              hasPrevious: response.data.hasPrevious || false,
            };
          }
          return {
            list: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 0,
            hasNext: false,
            hasPrevious: false,
          };
        })
      );
  }

  uploadAttachment(file: File, id?: string): Observable<any> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];

        const attachmentRequest: AttachmentRequestDto = {
          name: file.name,
          type: file.type,
          bytes: base64,
        };

        if (id) {
          attachmentRequest['id'] = id;
        }

        const request = [];
        request.push(attachmentRequest);

        this.http.post(`${this.baseUrl}/attachments`, request, this.getHeaders()).subscribe({
          next: (response) => observer.next(response),
          error: (error) => observer.error(error),
        });
      };
      reader.onerror = (error) => observer.error(error);
      reader.readAsDataURL(file);
    });
  }

  uploadMultipleAttachments(files: File[]): Observable<any> {
    const attachmentPromises = files.map((file) => {
      return new Promise<AttachmentRequestDto>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          resolve({
            name: file.name,
            type: file.type,
            bytes: base64,
          });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    });

    return from(Promise.all(attachmentPromises)).pipe(
      switchMap((attachments) =>
        this.http.post(`${this.baseUrl}/attachments`, attachments, this.getHeaders())
      )
    );
  }

  createAdRequest(request: ClientAdRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/request-ad`, request, this.getHeaders());
  }

  validateAd(adId: string, validation: string, refusedData?: RefusedAdRequestDto): Observable<any> {
    const url = `${this.baseUrl}/validate-ad/${adId}?validation=${validation}`;

    if (validation === 'REJECTED' && refusedData) {
      return this.http.patch(url, refusedData, this.getHeaders());
    }

    return this.http.patch(url, {}, this.getHeaders());
  }

  addToWishlist(monitorId: string): Observable<boolean> {
    return this.http
      .post<ResponseDto<any>>(`${this.baseUrl}/wishlist/${monitorId}`, {}, this.getHeaders())
      .pipe(
        map((response: ResponseDto<any>) => response.success || false),
        catchError(() => of(false))
      );
  }

  getWishlist(): Observable<WishlistResponseDto> {
    return this.http
      .get<ResponseDTO<WishlistResponseDto>>(`${this.baseUrl}/wishlist`, this.getHeaders())
      .pipe(map((response) => response.data));
  }
}


