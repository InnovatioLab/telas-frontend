import { Observable } from 'rxjs';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { IBaseRepository, IHttpConfig, IErrorHandler } from '@app/core/interfaces/services/repository/client-repository.interface';
import { IBaseResponseDto, IPaginatedResponseDto, IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';
import { ENVIRONMENT } from 'src/environments/environment-token';

/**
 * Interface para configuração de requisições HTTP
 */
export interface IHttpRequestConfig {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
  observe?: 'body' | 'events' | 'response';
  reportProgress?: boolean;
}

/**
 * Interface para operações HTTP específicas
 */
export interface IHttpOperations<T, CreateDto, UpdateDto> extends IBaseRepository<T, CreateDto, UpdateDto> {
  /**
   * Busca com filtros
   * @param filter - Filtros para aplicar
   * @returns Observable com array de entidades
   */
  findByFilter(filter: IBaseFilterDto): Observable<T[]>;

  /**
   * Busca paginada
   * @param filter - Filtros para aplicar
   * @returns Observable com resposta paginada
   */
  findPaginated(filter: IBaseFilterDto): Observable<IPaginatedResponseDto<T>>;

  /**
   * Busca por múltiplos IDs
   * @param ids - Array de IDs
   * @returns Observable com array de entidades
   */
  findByIds(ids: string[]): Observable<T[]>;

  /**
   * Conta total de registros
   * @param filter - Filtros para aplicar
   * @returns Observable com total
   */
  count(filter?: IBaseFilterDto): Observable<number>;

  /**
   * Verifica se existe
   * @param id - ID para verificar
   * @returns Observable com boolean
   */
  exists(id: string): Observable<boolean>;

  /**
   * Busca com configuração customizada
   * @param config - Configuração da requisição
   * @returns Observable com array de entidades
   */
  findWithConfig(config: IHttpRequestConfig): Observable<T[]>;
}

/**
 * Classe base para serviços HTTP com interfaces bem definidas
 * Implementa o padrão Repository e fornece operações CRUD padronizadas
 */
@Injectable()
export abstract class BaseHttpService<T, CreateDto = T, UpdateDto = Partial<T>> 
  implements IHttpOperations<T, CreateDto, UpdateDto> {
  
  protected readonly http: HttpClient;
  protected readonly baseUrl: string;
  protected readonly config: IHttpConfig;

  constructor(
    httpClient: HttpClient,
    protected readonly route: string,
    httpConfig?: Partial<IHttpConfig>
  ) {
    this.http = httpClient;
    this.config = this.mergeConfig(httpConfig);
    this.baseUrl = this.buildBaseUrl();
  }

  /**
   * Constrói a URL base
   */
  private buildBaseUrl(): string {
    const env = inject(ENVIRONMENT);
    return `${env.apiUrl}${this.route}`;
  }

  /**
   * Mescla configuração padrão com configuração fornecida
   */
  private mergeConfig(config?: Partial<IHttpConfig>): IHttpConfig {
    return {
      baseUrl: this.baseUrl,
      timeout: 30000,
      retryAttempts: 3,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...config
    };
  }

  /**
   * Busca todas as entidades
   */
  findAll(): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl, this.getDefaultHeaders());
  }

  /**
   * Busca entidade por ID
   */
  findById(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`, this.getDefaultHeaders());
  }

  /**
   * Salva nova entidade
   */
  save(entity: CreateDto): Observable<T> {
    return this.http.post<T>(this.baseUrl, entity, this.getDefaultHeaders());
  }

  /**
   * Atualiza entidade existente
   */
  update(id: string, entity: UpdateDto): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${id}`, entity, this.getDefaultHeaders());
  }

  /**
   * Remove entidade
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getDefaultHeaders());
  }

  /**
   * Busca com filtros
   */
  findByFilter(filter: IBaseFilterDto): Observable<T[]> {
    const params = this.createFilterParams(filter);
    return this.http.get<T[]>(this.baseUrl, {
      ...this.getDefaultHeaders(),
      params
    });
  }

  /**
   * Busca paginada
   */
  findPaginated(filter: IBaseFilterDto): Observable<IPaginatedResponseDto<T>> {
    const params = this.createFilterParams(filter);
    return this.http.get<IPaginatedResponseDto<T>>(`${this.baseUrl}/paginated`, {
      ...this.getDefaultHeaders(),
      params
    });
  }

  /**
   * Busca por múltiplos IDs
   */
  findByIds(ids: string[]): Observable<T[]> {
    const params = new HttpParams().set('ids', ids.join(','));
    return this.http.get<T[]>(`${this.baseUrl}/batch`, {
      ...this.getDefaultHeaders(),
      params
    });
  }

  /**
   * Conta total de registros
   */
  count(filter?: IBaseFilterDto): Observable<number> {
    const params = filter ? this.createFilterParams(filter) : undefined;
    return this.http.get<number>(`${this.baseUrl}/count`, {
      ...this.getDefaultHeaders(),
      params
    });
  }

  /**
   * Verifica se existe
   */
  exists(id: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/${id}/exists`, this.getDefaultHeaders());
  }

  /**
   * Busca com configuração customizada
   */
  findWithConfig(config: IHttpRequestConfig): Observable<T[]> {
    return this.http.get<T[]>(this.baseUrl, {
      ...this.getDefaultHeaders(),
      ...config
    });
  }

  /**
   * Cria parâmetros de filtro
   */
  protected createFilterParams(filter: IBaseFilterDto): HttpParams {
    let params = new HttpParams();
    
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    
    if (filter.sortDirection) {
      params = params.set('sortDirection', filter.sortDirection);
    }
    
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    
    if (filter.size !== undefined) {
      params = params.set('size', filter.size.toString());
    }

    return params;
  }

  /**
   * Obtém headers padrão
   */
  protected getDefaultHeaders(): IHttpRequestConfig {
    return {
      headers: this.config.headers
    };
  }

  /**
   * Cria parâmetros HTTP a partir de objeto
   * @deprecated Use createFilterParams para novos códigos
   */
  protected criarParametros(filtro: any): HttpParams {
    let httpParams = new HttpParams();
    
    for (const prop in filtro) {
      if (Object.prototype.hasOwnProperty.call(filtro, prop) && 
          filtro[prop] != null && 
          filtro[prop] !== '') {
        
        if (typeof filtro[prop] === 'number') {
          httpParams = httpParams.append(prop, filtro[prop].toString());
        } else {
          httpParams = httpParams.append(prop, filtro[prop]);
        }
      }
    }

    return httpParams;
  }

  /**
   * Método para tratamento de erros
   * Pode ser sobrescrito pelas classes filhas
   */
  protected handleError(error: any): Observable<never> {
    console.error('HTTP Error:', error);
    throw error;
  }
}





