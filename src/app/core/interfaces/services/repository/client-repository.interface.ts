import { Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';

/**
 * Interface para operações de repositório de Cliente
 * Implementa o padrão Repository para desacoplar a lógica de acesso a dados
 */
export interface IClientRepository {
  /**
   * Busca um cliente por ID
   * @param id - ID do cliente
   * @returns Observable com o cliente encontrado
   */
  findById(id: string): Observable<Client>;

  /**
   * Busca todos os clientes
   * @returns Observable com array de clientes
   */
  findAll(): Observable<Client[]>;

  /**
   * Salva um novo cliente
   * @param client - Dados do cliente para salvar
   * @returns Observable com o cliente salvo
   */
  save(client: ClientRequestDTO): Observable<Client>;

  /**
   * Atualiza um cliente existente
   * @param id - ID do cliente
   * @param client - Dados do cliente para atualizar
   * @returns Observable com o cliente atualizado
   */
  update(id: string, client: Partial<ClientRequestDTO>): Observable<Client>;

  /**
   * Remove um cliente
   * @param id - ID do cliente
   * @returns Observable vazio
   */
  delete(id: string): Observable<void>;

  /**
   * Busca cliente autenticado
   * @returns Observable com dados do cliente autenticado
   */
  getAuthenticatedClient(): Observable<any>;

  /**
   * Busca anúncios do cliente
   * @returns Observable com array de anúncios
   */
  getClientAds(): Observable<any[]>;

  /**
   * Busca anexos do cliente
   * @returns Observable com array de anexos
   */
  getClientAttachments(): Observable<any[]>;
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














