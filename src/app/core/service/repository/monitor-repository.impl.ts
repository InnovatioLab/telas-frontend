import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Inject, Optional } from '@angular/core';
import { IMonitorRepository } from '@app/core/interfaces/services/repository/monitor-repository.interface';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { MonitorResponseDto } from '@app/model/dto/response/monitor-response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { Monitor } from '@app/model/monitors';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class MonitorRepositoryImpl extends BaseRepository<Monitor, CreateMonitorRequestDto, UpdateMonitorRequestDto> implements IMonitorRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'monitors', env);
  }

  override findWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>> {
    let params = this.createFilterParams(filters);
    params = params.set('_t', Date.now().toString());

    return this.http
      .get<ResponseDTO<PaginationResponseDto<MonitorResponseDto>> | ResponseDto<PaginationResponseDto<MonitorResponseDto>>>(
        `${this.baseUrl}/filters`,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          if (data && typeof data === 'object' && 'list' in data) {
            const paginatedData = data as PaginationResponseDto<MonitorResponseDto>;
            const mappedList = paginatedData.list.map(this.mapMonitorResponseToMonitor);
            return {
              ...paginatedData,
              list: mappedList,
            };
          }
          throw new Error('API não retornou dados dos monitores');
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  override findAll(): Observable<Monitor[]> {
    return this.findWithPagination().pipe(
      map((paginated) => paginated.list),
      catchError(() => of([]))
    );
  }

  override findById(id: string): Observable<Monitor | null> {
    return this.http
      .get<ResponseDTO<MonitorResponseDto> | ResponseDto<MonitorResponseDto>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          if (data) {
            return this.mapMonitorResponseToMonitor(data as MonitorResponseDto);
          }
          return null;
        }),
        catchError(() => of(null))
      );
  }

  override create(request: CreateMonitorRequestDto): Observable<Monitor> {
    return this.http
      .post<ResponseDTO<void> | ResponseDto<void>>(this.baseUrl, request, this.getHeaders())
      .pipe(
        map(() => {
          return {} as Monitor;
        }),
        catchError(() => of({} as Monitor))
      );
  }

  override update(id: string, request: UpdateMonitorRequestDto): Observable<Monitor> {
    return this.http
      .put<ResponseDTO<void> | ResponseDto<void>>(`${this.baseUrl}/${id}`, request, this.getHeaders())
      .pipe(
        map(() => {
          return {} as Monitor;
        }),
        catchError(() => of({} as Monitor))
      );
  }

  override delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDTO<any> | ResponseDto<any>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response: ResponseDTO<any> | ResponseDto<any>) => {
          return !!response;
        }),
        catchError(() => of(false))
      );
  }

  findValidAds(monitorId: string): Observable<any[]> {
    return this.http
      .get<ResponseDTO<any[]> | ResponseDto<any[]>>(`${this.baseUrl}/valid-ads/${monitorId}`, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return Array.isArray(data) ? data : [];
        }),
        catchError(() => of([]))
      );
  }

  private mapMonitorResponseToMonitor(monitorResponse: MonitorResponseDto): Monitor {
    return {
      id: monitorResponse.id,
      active: monitorResponse.active,
      fullAddress: monitorResponse.fullAddress,
      address: monitorResponse.address || {
        id: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
      },
      adLinks: monitorResponse.adLinks || [],
      canBeDeleted: monitorResponse.canBeDeleted,
      createdAt: monitorResponse.createdAt,
      updatedAt: monitorResponse.updatedAt,
    };
  }
}
