import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IMonitorRepository } from '@app/core/interfaces/services/repository/monitor-repository.interface';
import { Monitor } from '@app/model/monitors';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { MonitorResponseDto } from '@app/model/dto/response/monitor-response.dto';

@Injectable({ providedIn: 'root' })
export class MonitorRepositoryImpl implements IMonitorRepository {
  private readonly baseUrl = `${environment.apiUrl}monitors`;
  private readonly storageName = 'telas_token';
  private readonly token = localStorage.getItem(this.storageName);

  private readonly headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  findWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>> {
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
      .get<ResponseDto<PaginationResponseDto<MonitorResponseDto>>>(`${this.baseUrl}/filters`, { params })
      .pipe(
        map((response: ResponseDto<PaginationResponseDto<MonitorResponseDto>>) => {
          if (response?.data) {
            const mappedList = response.data.list.map(this.mapMonitorResponseToMonitor);
            return {
              ...response.data,
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

  findById(id: string): Observable<Monitor | null> {
    return this.http
      .get<ResponseDto<MonitorResponseDto>>(`${this.baseUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<MonitorResponseDto>) => {
          if (response?.data) {
            return this.mapMonitorResponseToMonitor(response.data);
          }
          return null;
        }),
        catchError(() => of(null))
      );
  }

  create(request: CreateMonitorRequestDto): Observable<boolean> {
    return this.http
      .post<ResponseDto<void>>(this.baseUrl, request, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          return !!response;
        }),
        catchError(() => of(false))
      );
  }

  update(id: string, request: UpdateMonitorRequestDto): Observable<boolean> {
    return this.http
      .put<ResponseDto<void>>(`${this.baseUrl}/${id}`, request, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          return !!response;
        }),
        catchError(() => of(false))
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDto<any>>(`${this.baseUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          return !!response;
        }),
        catchError(() => of(false))
      );
  }

  findValidAds(monitorId: string): Observable<any[]> {
    return this.http
      .get<ResponseDto<any[]>>(`${this.baseUrl}/valid-ads/${monitorId}`, this.headers)
      .pipe(
        map((response: ResponseDto<any[]>) => {
          return response.data || [];
        }),
        catchError(() => of([]))
      );
  }

  private mapMonitorResponseToMonitor(monitorResponse: MonitorResponseDto): Monitor {
    return {
      id: monitorResponse.id,
      active: monitorResponse.active,
      locationDescription: monitorResponse.locationDescription,
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




