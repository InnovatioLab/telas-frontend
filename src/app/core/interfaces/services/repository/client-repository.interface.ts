import { Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';
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

export interface ClientFilterDto extends IBaseFilterDto {}

export interface IClientRepository extends IRepository<Client, ClientRequestDTO, Partial<ClientRequestDTO>, ClientFilterDto> {
  save(client: ClientRequestDTO): Observable<Client>;

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto>;

  getClientAds(): Observable<any[]>;

  getClientAttachments(): Observable<any[]>;

  saveWithLoadingOption(client: ClientRequestDTO, ignorarLoading?: boolean): Observable<any>;

  editar(id: string, client: ClientRequestDTO): Observable<any>;

  criarSenha(login: string, request: SenhaRequestDto): Observable<any>;

  atualizardadosPerfil(id: string, client: ClientRequestDTO): Observable<any>;

  reenvioCodigo(login: string): Observable<any>;

  validarCodigo(login: string, code: string): Observable<any>;

  aceitarTermosDeCondicao(): Observable<any>;

  clientExistente(email: string): Observable<ClientResponseDTO>;

  buscarClient<T>(idOuUID: string): Observable<T>;

  buscaClientPorIdentificador(email: string): Observable<ClientResponseDTO>;

  getAllAds(page?: number, size?: number): Observable<Page<AdResponseDto>>;

  getAllAdRequests(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<AdRequestResponseDto>>;

  getPendingAds(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<PendingAdAdminValidationResponseDto>>;

  uploadAttachment(file: File, id?: string): Observable<any>;

  uploadMultipleAttachments(files: File[]): Observable<any>;

  createAdRequest(request: ClientAdRequestDto): Observable<any>;

  validateAd(adId: string, validation: string, refusedData?: RefusedAdRequestDto): Observable<any>;

  addToWishlist(monitorId: string): Observable<boolean>;

  getWishlist(): Observable<WishlistResponseDto>;
}

/**
 * Interface para operações de repositório genérico
 * Define operações CRUD básicas para qualquer entidade
 */
export interface IBaseRepository<T, CreateDto, UpdateDto> {
  findById(id: string): Observable<T>;
  findAll(): Observable<T[]>;
  save(entity: CreateDto): Observable<T>;
  update(id: string, entity: UpdateDto): Observable<T>;
  delete(id: string): Observable<void>;
}

/**
 * Interface para tratamento de erros em repositórios
 */
export interface IErrorHandler {
  handleError(error: any): void;
  extractErrorMessage(error: any): string;
}

/**
 * Interface para configuração de HTTP
 */
export interface IHttpConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  headers: Record<string, string>;
}
