import { Inject, Injectable } from "@angular/core";
import { IClientRepository } from "@app/core/interfaces/services/repository/client-repository.interface";
import { ClientDomainService } from "@app/core/service/domain/client.domain.service";
import { CLIENT_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";
import { Client } from "@app/model/client";
import { ClientAdRequestDto } from "@app/model/dto/request/client-ad-request.dto";
import { ClientRequestDTO } from "@app/model/dto/request/client-request.dto";
import { RefusedAdRequestDto } from "@app/model/dto/request/refused-ad-request.dto";
import { SenhaRequestDto } from "@app/model/dto/request/senha-request.dto";
import {
  AdRequestResponseDto,
  PendingAdAdminValidationResponseDto,
} from "@app/model/dto/response/ad-request-response.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { ClientResponseDTO } from "@app/model/dto/response/client-response.dto";
import { Page } from "@app/model/dto/page.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { WishlistResponseDto } from "@app/model/dto/response/wishlist-response.dto";
import {
  BehaviorSubject,
  Observable,
  Subject,
} from "rxjs";
import { FilterClientRequestDto } from "./client-management.service";

@Injectable({ providedIn: "root" })
export class ClientService {
  cancelarEdicao$: Subject<boolean> = new Subject<boolean>();

  public clientAtual$ = new BehaviorSubject<Client | null>(null);

  constructor(
    @Inject(CLIENT_REPOSITORY_TOKEN) private readonly clientRepository: IClientRepository,
    private readonly clientDomainService: ClientDomainService,
  ) {}

  save(perfil: ClientRequestDTO, ignorarLoading = false) {
    return this.clientRepository.saveWithLoadingOption(perfil, ignorarLoading);
  }

  editar(id: string, perfil: ClientRequestDTO) {
    return this.clientRepository.editar(id, perfil);
  }

  criarSenha(login: string, request: SenhaRequestDto) {
    return this.clientRepository.criarSenha(login, request);
  }

  atualizardadosPerfil(id: string, client: ClientRequestDTO) {
    return this.clientRepository.atualizardadosPerfil(id, client);
  }

  reenvioCodigo(login: string) {
    return this.clientRepository.reenvioCodigo(login);
  }

  validarCodigo(login: string, code: string) {
    return this.clientRepository.validarCodigo(login, code);
  }

  aceitarTermosDeCondicao() {
    return this.clientRepository.aceitarTermosDeCondicao();
  }

  clientExistente(email: string): Observable<ClientResponseDTO> {
    return this.clientRepository.clientExistente(email);
  }

  buscarClient<T>(idOuUID: string): Observable<T> {
    return this.clientRepository.buscarClient<T>(idOuUID);
  }

  buscaClientPorIdentificador(email: string): Observable<ClientResponseDTO> {
    return this.clientRepository.buscaClientPorIdentificador(email);
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
    return this.clientRepository.getAllAds(page, size);
  }

  getAllAdRequests(
    filters?: FilterClientRequestDto
  ): Observable<PaginationResponseDto<AdRequestResponseDto>> {
    return this.clientRepository.getAllAdRequests(filters);
  }

  getPendingAds(
    filters?: FilterClientRequestDto
  ): Observable<PaginationResponseDto<PendingAdAdminValidationResponseDto>> {
    return this.clientRepository.getPendingAds(filters);
  }

  uploadAttachment(file: File, id?: string): Observable<any> {
    return this.clientRepository.uploadAttachment(file, id);
  }

  uploadMultipleAttachments(files: File[]): Observable<any> {
    return this.clientRepository.uploadMultipleAttachments(files);
  }

  createAdRequest(request: ClientAdRequestDto): Observable<any> {
    return this.clientRepository.createAdRequest(request);
  }

  validateAd(
    adId: string,
    validation: string,
    refusedData?: RefusedAdRequestDto
  ): Observable<any> {
    return this.clientRepository.validateAd(adId, validation, refusedData);
  }

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.clientRepository.getAuthenticatedClient();
  }

  addToWishlist(monitorId: string): Observable<boolean> {
    return this.clientRepository.addToWishlist(monitorId);
  }

  getWishlist(): Observable<WishlistResponseDto> {
    return this.clientRepository.getWishlist();
  }
}
