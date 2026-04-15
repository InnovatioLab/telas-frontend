import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { IRepository } from '@app/core/interfaces/services/repository/repository.interface';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { environment } from 'src/environments/environment';

@Injectable()
export abstract class BaseRepository<T, CreateDto = Partial<T>, UpdateDto = Partial<T>, FilterDto extends IBaseFilterDto = IBaseFilterDto>
  implements IRepository<T, CreateDto, UpdateDto, FilterDto> {
  
  protected readonly http: HttpClient;
  protected readonly baseUrl: string;
  private readonly storageName = 'telas_token';

  constructor(
    httpClient: HttpClient,
    protected readonly route: string,
    @Optional() @Inject(ENVIRONMENT) protected readonly env?: any
  ) {
    this.http = httpClient;
    this.baseUrl = this.buildBaseUrl();
  }

  private buildBaseUrl(): string {
    const apiUrl = this.env?.apiUrl || environment.apiUrl;
    return `${apiUrl}${this.route}`;
  }

  protected getHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem(this.storageName);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
    return { headers };
  }

  protected extractData<R>(response: ResponseDTO<R> | ResponseDto<R>): R {
    if ('data' in response) {
      return response.data;
    }
    return (response as any).data;
  }

  protected createFilterParams(filter?: FilterDto): HttpParams {
    let params = new HttpParams();
    
    if (!filter) {
      return params;
    }

    if (filter.search) {
      params = params.set('search', filter.search);
    }
    
    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    
    if (filter.sortDirection) {
      params = params.set('sortDirection', filter.sortDirection);
    } else if ((filter as any).sortDir) {
      params = params.set('sortDir', (filter as any).sortDir);
    }
    
    if (filter.page !== undefined) {
      params = params.set('page', filter.page.toString());
    }
    
    if (filter.size !== undefined) {
      params = params.set('size', filter.size.toString());
    }

    if ((filter as any).genericFilter) {
      params = params.set('genericFilter', (filter as any).genericFilter);
    }

    if ((filter as any).active !== undefined) {
      params = params.set('active', (filter as any).active.toString());
    }

    return params;
  }

  findAll(filters?: FilterDto): Observable<T[]> {
    const params = this.createFilterParams(filters);
    return this.http
      .get<ResponseDTO<T[]> | ResponseDto<T[]>>(this.baseUrl, { ...this.getHeaders(), params })
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return Array.isArray(data) ? data : [];
        }),
        catchError(() => of([]))
      );
  }

  findById(id: string): Observable<T | null> {
    return this.http
      .get<ResponseDTO<T> | ResponseDto<T>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return data || null;
        }),
        catchError(() => of(null))
      );
  }

  create(entity: CreateDto): Observable<T> {
    return this.http
      .post<ResponseDTO<T> | ResponseDto<T>>(this.baseUrl, entity, this.getHeaders())
      .pipe(
        map((response) => this.extractData(response))
      );
  }

  update(id: string, entity: UpdateDto): Observable<T> {
    return this.http
      .put<ResponseDTO<T> | ResponseDto<T>>(`${this.baseUrl}/${id}`, entity, this.getHeaders())
      .pipe(
        map((response) => this.extractData(response))
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDTO<any> | ResponseDto<any>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          if (typeof data === 'boolean') {
            return data;
          }
          if (response && 'success' in response) {
            return (response as ResponseDto<any>).success || false;
          }
          return true;
        }),
        catchError(() => of(false))
      );
  }

  findWithPagination(filters?: FilterDto): Observable<PaginationResponseDto<T>> {
    const params = this.createFilterParams(filters);
    return this.http
      .get<ResponseDTO<PaginationResponseDto<T>> | ResponseDto<PaginationResponseDto<T>>>(
        this.baseUrl,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          
          if (Array.isArray(data)) {
            return {
              list: data,
              totalElements: data.length,
              totalPages: 1,
              currentPage: filters?.page || 0,
              size: filters?.size || data.length,
              hasNext: false,
              hasPrevious: false
            };
          }

          if (data && typeof data === 'object' && 'list' in data) {
            return {
              list: (data as PaginationResponseDto<T>).list || [],
              totalElements: (data as PaginationResponseDto<T>).totalElements || 0,
              totalPages: (data as PaginationResponseDto<T>).totalPages || 0,
              currentPage: (data as PaginationResponseDto<T>).currentPage || 0,
              size: (data as PaginationResponseDto<T>).size || 0,
              hasNext: (data as PaginationResponseDto<T>).hasNext || false,
              hasPrevious: (data as PaginationResponseDto<T>).hasPrevious || false
            };
          }

          return {
            list: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 0,
            hasNext: false,
            hasPrevious: false
          };
        }),
        catchError(() => of({
          list: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          size: 0,
          hasNext: false,
          hasPrevious: false
        }))
      );
  }

  protected handleError(error: any): Observable<never> {
    throw error;
  }
}

