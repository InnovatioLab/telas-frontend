import { HttpBackend, HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Client } from "@app/model/client";
import { Page } from "@app/model/dto/page.dto";
import { AttachmentRequestDto } from "@app/model/dto/request/attachment-request.dto";
import { ClientAdRequestDto } from "@app/model/dto/request/client-ad-request.dto";
import { ClientRequestDTO } from "@app/model/dto/request/client-request.dto";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { SenhaRequestDto } from "@app/model/dto/request/senha-request.dto";
import { ResponseDTO } from "@app/model/dto/response.dto";
import {
  AdRequestResponseDto,
  PendingAdAdminValidationResponseDto,
} from "@app/model/dto/response/ad-request-response.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { ClientResponseDTO } from "@app/model/dto/response/client-response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { WishlistResponseDto } from "@app/model/dto/response/wishlist-response.dto";
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  Subject,
} from "rxjs";
import { BaseHttpService } from "./base-htttp.service";
import { FilterClientRequestDto } from "./client-management.service";

@Injectable({ providedIn: "root" })
export class ClientService extends BaseHttpService<Client> {
  storageName = "telas_token";
  token = localStorage.getItem(this.storageName);
  httpBackend = new HttpClient(inject(HttpBackend));
  private readonly autenticado = { Authorization: `Bearer ${this.token}` };
  private readonly ignorarLoadingInterceptor = {
    "Ignorar-Loading-Interceptor": "true",
  };
  private readonly ignorarErrorInterceptor = {
    "Ignorar-Error-Interceptor": "true",
  };

  cancelarEdicao$: Subject<boolean> = new Subject<boolean>();

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  protected baseUrl: string;

  public clientAtual$ = new BehaviorSubject<Client | null>(null);

  constructor() {
    const http = inject(HttpClient);
    super(http, "clients");
    this.baseUrl = this.url;
  }

  save(perfil: ClientRequestDTO, ignorarLoading = false) {
    const deveIgnorarLoading = ignorarLoading
      ? { "Ignorar-Loading-Interceptor": "true" }
      : {};
    return this.http.post(`${this.baseUrl}`, perfil, {
      headers: {
        ...deveIgnorarLoading,
      },
    });
  }

  editar(id: string, perfil: ClientRequestDTO) {
    return this.http.put<SenhaRequestDto>(`${this.baseUrl}/${id}`, perfil);
  }

  criarSenha(login: string, request: SenhaRequestDto) {
    return this.http.patch<SenhaRequestDto>(
      `${this.baseUrl}/create-password/${login}`,
      request
    );
  }

  atualizardadosPerfil(id: string, client: ClientRequestDTO) {
    return this.http.put(`${this.baseUrl}/${id}`, client, this.headers);
  }

  reenvioCodigo(login: string) {
    return this.http.post(`${this.baseUrl}/resend-code/${login}`, {});
  }

  validarCodigo(login: string, code: string) {
    const params = new HttpParams().set("code", code);
    return this.http.patch(`${this.baseUrl}/validate-code/${login}`, null, {
      params,
    });
  }

  aceitarTermosDeCondicao() {
    return this.http.patch(
      `${this.baseUrl}/accept-terms-conditions`,
      null,
      this.headers
    );
  }

  clientExistente(login: string): Observable<ClientResponseDTO> {
    return this.http
      .get<
        ResponseDTO<ClientResponseDTO>
      >(`${this.baseUrl}/identification/${login}`)
      .pipe(map((data: ResponseDTO<ClientResponseDTO>) => data.data));
  }

  buscarClient<T>(idOuUID: string): Observable<T> {
    if (!idOuUID) {
      console.error("ID/UUID não fornecido para busca de usuário");
      throw new Error("ID/UUID não fornecido");
    }
    return this.http.get<ResponseDTO<T>>(`${this.baseUrl}/${idOuUID}`).pipe(
      map((response: ResponseDTO<T>) => {
        if (response?.data === undefined) {
          console.error("Resposta da API inválida:", response);
          throw new Error("Dados do usuário não encontrados");
        }
        return response.data;
      })
    );
  }

  buscaClientPorIdentificador<T>(
    identificador: string
  ): Observable<ClientResponseDTO> {
    if (!identificador) {
      console.error("Identificador não fornecido para busca de usuário");
      throw new Error("Identificador não fornecido");
    }
    return this.http
      .get<
        ResponseDTO<ClientResponseDTO>
      >(`${this.baseUrl}/identification/${identificador}`)
      .pipe(
        map((response: ResponseDTO<ClientResponseDTO>) => {
          if (response?.data === undefined) {
            console.error("Resposta da API inválida:", response);
            throw new Error("Dados do usuário não encontrados");
          }
          return response.data;
        })
      );
  }

  setClientAtual(client: Client | null) {
    this.clientAtual$.next(client);
    if (client) {
      localStorage.setItem("telas_token_user", JSON.stringify(client));
    }
  }

  getClientAtual(): Client | null {
    return this.clientAtual$.getValue();
  }

  getAllAds(
    page: number = 1,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<
        ResponseDTO<Page<AdResponseDto>>
      >(`${this.baseUrl}/ads-requests`, { params })
      .pipe(map((response) => response.data));
  }

  getAllAdRequests(
    filters?: FilterClientRequestDto
  ): Observable<PaginationResponseDto<AdRequestResponseDto>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set("page", filters.page.toString());
      if (filters.size) params = params.set("size", filters.size.toString());
      if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params = params.set("sortDir", filters.sortDir);
      if (filters.genericFilter)
        params = params.set("genericFilter", filters.genericFilter);
    }

    params = params.set("_t", Date.now().toString());

    return this.http
      .get<
        ResponseDTO<PaginationResponseDto<AdRequestResponseDto>>
      >(`${this.baseUrl}/ads-requests`, { params })
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

  // Buscar ads pendentes para admin validar
  getPendingAds(
    filters?: FilterClientRequestDto
  ): Observable<PaginationResponseDto<PendingAdAdminValidationResponseDto>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set("page", filters.page.toString());
      if (filters.size) params = params.set("size", filters.size.toString());
      if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params = params.set("sortDir", filters.sortDir);
      if (filters.genericFilter)
        params = params.set("genericFilter", filters.genericFilter);
    }

    params = params.set("_t", Date.now().toString());

    return this.http
      .get<
        ResponseDTO<PaginationResponseDto<PendingAdAdminValidationResponseDto>>
      >(`${this.baseUrl}/pending-ads`, { params })
      .pipe(
        map(
          (
            response: ResponseDTO<
              PaginationResponseDto<PendingAdAdminValidationResponseDto>
            >
          ) => {
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
          }
        )
      );
  }

  uploadAttachment(file: File): Observable<any> {
    // Converter arquivo para Base64
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];

        const attachmentRequest: AttachmentRequestDto = {
          name: file.name,
          type: file.type,
          bytes: base64,
        };

        this.http
          .post(`${this.baseUrl}/attachments`, attachmentRequest)
          .subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
          });
      };
      reader.onerror = (error) => observer.error(error);
      reader.readAsDataURL(file);
    });
  }

  uploadMultipleAttachments(files: File[]): Observable<any> {
    return new Observable((observer) => {
      const attachmentPromises = files.map((file) => {
        return new Promise<AttachmentRequestDto>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(",")[1];
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

      Promise.all(attachmentPromises)
        .then((attachments) => {
          this.http.post(`${this.baseUrl}/attachments`, attachments).subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error),
          });
        })
        .catch((error) => observer.error(error));
    });
  }

  createAdRequest(request: ClientAdRequestDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/request-ad`, request);
  }

  // Validar ad
  validateAd(
    adId: string,
    validation: string,
    refusedData?: RefusedAdRequestDto
  ): Observable<any> {
    let url = `${this.baseUrl}/validate-ad/${adId}?validation=${validation}`;

    if (validation === "REJECTED" && refusedData) {
      return this.http.patch(url, refusedData);
    }

    return this.http.patch(url, {});
  }

  // Buscar cliente autenticado
  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.http
      .get<
        ResponseDTO<AuthenticatedClientResponseDto>
      >(`${this.baseUrl}/authenticated`)
      .pipe(map((response) => response.data));
  }

  addToWishlist(monitorId: string): Observable<boolean> {
    return this.http
      .post<
        ResponseDto<any>
      >(`${this.baseUrl}/wishlist/${monitorId}`, {}, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => response.success || false),
        catchError((error) => {
          return of(false);
        })
      );
  }

  getWishlist(): Observable<WishlistResponseDto> {
    return this.http
      .get<
        ResponseDTO<WishlistResponseDto>
      >(`${this.baseUrl}/wishlist`, this.headers)
      .pipe(map((response) => response.data));
  }
}
