import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IBoxRepository } from '@app/core/interfaces/services/repository/box-repository.interface';
import { Box } from '@app/model/box';
import { BoxAddress } from '@app/model/box-address';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { BoxResponseDto, BoxAddressDto } from '@app/model/dto/response/box-response.dto';
import { BoxAddressResponseDto } from '@app/model/dto/response/box-address-response.dto';
import { MonitorsBoxMinResponseDto } from '@app/model/dto/response/monitor-box-min-response.dto';
import { Monitor } from '@app/model/monitors';

@Injectable({ providedIn: 'root' })
export class BoxRepositoryImpl implements IBoxRepository {
  private readonly baseUrl = `${environment.apiUrl}boxes`;
  private readonly storageName = 'telas_token';
  private readonly token = localStorage.getItem(this.storageName);

  private readonly headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  findAvailableAddresses(): Observable<BoxAddress[]> {
    return this.http
      .get<ResponseDto<BoxAddressResponseDto[]>>(`${this.baseUrl}/addresses`, this.headers)
      .pipe(
        map((response: ResponseDto<BoxAddressResponseDto[]>) => {
          return response.data
            ? this.mapBoxAddressResponseToBoxAddress(response.data)
            : null;
        }),
        catchError(() => of(null))
      );
  }

  findAvailableMonitors(): Observable<MonitorsBoxMinResponseDto[]> {
    return this.http
      .get<ResponseDto<MonitorsBoxMinResponseDto[]>>(`${environment.apiUrl}monitors`, this.headers)
      .pipe(
        map((response: ResponseDto<MonitorsBoxMinResponseDto[]>) => {
          return response.data || [];
        }),
        catchError(() => of([]))
      );
  }

  findAll(filters?: FilterBoxRequestDto): Observable<Box[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
    }

    return this.http
      .get<ResponseDto<PaginationResponseDto<BoxResponseDto>>>(this.baseUrl, { params, ...this.headers })
      .pipe(
        map((response: ResponseDto<PaginationResponseDto<BoxResponseDto>>) => {
          let boxes: BoxResponseDto[] = [];

          if (Array.isArray(response.data)) {
            boxes = response.data;
          } else if (response.data?.list) {
            boxes = response.data.list;
          }

          return boxes.map((box) => this.mapBoxResponseToBox(box));
        }),
        catchError(() => of([]))
      );
  }

  findWithPagination(filters?: FilterBoxRequestDto): Observable<PaginationResponseDto<Box>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
    }

    return this.http
      .get<ResponseDto<PaginationResponseDto<BoxResponseDto>>>(this.baseUrl, { params, ...this.headers })
      .pipe(
        map((response: ResponseDto<PaginationResponseDto<BoxResponseDto>>) => {
          let boxes: BoxResponseDto[] = [];
          let totalElements = 0;

          if (Array.isArray(response.data)) {
            boxes = response.data;
            totalElements = response.data.length;
          } else if (response.data?.list) {
            boxes = response.data.list;
            totalElements = response.data.totalElements || 0;
          }

          const mappedBoxes = boxes.map((box) => this.mapBoxResponseToBox(box));

          return {
            list: mappedBoxes,
            totalElements: totalElements,
            totalPages: response.data?.totalPages || 1,
            currentPage: response.data?.currentPage || 1,
            size: response.data?.size || totalElements,
            hasNext: response.data?.hasNext || false,
            hasPrevious: response.data?.hasPrevious || false,
          };
        }),
        catchError(() => {
          return of({
            list: [],
            totalElements: 0,
            totalPages: 0,
            currentPage: 0,
            size: 0,
            hasNext: false,
            hasPrevious: false,
          });
        })
      );
  }

  findById(id: string): Observable<Box | null> {
    return this.http
      .get<ResponseDto<BoxResponseDto>>(`${this.baseUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<BoxResponseDto>) => {
          return response.data ? this.mapBoxResponseToBox(response.data) : null;
        }),
        catchError(() => of(null))
      );
  }

  create(boxRequest: BoxRequestDto): Observable<Box> {
    return this.http
      .post<ResponseDto<Box>>(this.baseUrl, boxRequest, this.headers)
      .pipe(
        map((response: ResponseDto<Box>) => {
          return response.data || ({} as Box);
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  update(id: string, boxRequest: BoxRequestDto): Observable<Box> {
    return this.http
      .put<ResponseDto<BoxResponseDto>>(`${this.baseUrl}/${id}`, boxRequest, this.headers)
      .pipe(
        map((response: ResponseDto<BoxResponseDto>) => {
          return response.data ? this.mapBoxResponseToBox(response.data) : ({} as Box);
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDto<any>>(`${this.baseUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          return response.success || false;
        }),
        catchError(() => of(false))
      );
  }

  findMonitorsByIp(ip: string): Observable<Monitor[]> {
    let params = new HttpParams();
    params = params.set('ip', ip);

    return this.http
      .get<ResponseDto<Monitor[]>>(this.baseUrl, { params, ...this.headers })
      .pipe(
        map((response: ResponseDto<Monitor[]>) => {
          return response.data || [];
        }),
        catchError(() => of([]))
      );
  }

  private mapBoxResponseToBox(boxResponse: BoxResponseDto): Box {
    const box: Box = {
      id: boxResponse.id,
      ip: boxResponse.boxAddress.ip,
      macAddress: boxResponse.boxAddress.mac,
      boxAddressId: boxResponse.boxAddress.id,
      monitorIds: boxResponse.monitors.map((monitor) => monitor.id),
      active: boxResponse.active,
      monitorCount: boxResponse.monitors.length,
    };

    return box;
  }

  private mapBoxAddressResponseToBoxAddress(data: BoxAddressResponseDto[]): BoxAddress[] {
    return data.map((item) => ({
      id: item.id,
      mac: item.mac,
      ip: item.ip ?? '',
    }));
  }
}














