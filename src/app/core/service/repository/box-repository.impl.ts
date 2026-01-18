import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { IBoxRepository } from '@app/core/interfaces/services/repository/box-repository.interface';
import { Box } from '@app/model/box';
import { BoxAddress } from '@app/model/box-address';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { BoxResponseDto } from '@app/model/dto/response/box-response.dto';
import { BoxAddressResponseDto } from '@app/model/dto/response/box-address-response.dto';
import { MonitorsBoxMinResponseDto } from '@app/model/dto/response/monitor-box-min-response.dto';
import { Monitor } from '@app/model/monitors';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BoxRepositoryImpl extends BaseRepository<Box, BoxRequestDto, BoxRequestDto> implements IBoxRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'boxes', env);
  }

  override findAll(filters?: FilterBoxRequestDto): Observable<Box[]> {
    const params = this.createFilterParams(filters);
    return this.http
      .get<ResponseDTO<PaginationResponseDto<BoxResponseDto>> | ResponseDto<PaginationResponseDto<BoxResponseDto>>>(
        this.baseUrl,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          let boxes: BoxResponseDto[] = [];

          if (Array.isArray(data)) {
            boxes = data;
          } else if (data && typeof data === 'object' && 'list' in data) {
            boxes = (data as PaginationResponseDto<BoxResponseDto>).list || [];
          }

          return boxes.map((box) => this.mapBoxResponseToBox(box));
        }),
        catchError(() => of([]))
      );
  }

  override findWithPagination(filters?: FilterBoxRequestDto): Observable<PaginationResponseDto<Box>> {
    const params = this.createFilterParams(filters);
    return this.http
      .get<ResponseDTO<PaginationResponseDto<BoxResponseDto>> | ResponseDto<PaginationResponseDto<BoxResponseDto>>>(
        this.baseUrl,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          let boxes: BoxResponseDto[] = [];
          let totalElements = 0;

          if (Array.isArray(data)) {
            boxes = data;
            totalElements = data.length;
          } else if (data && typeof data === 'object' && 'list' in data) {
            const paginatedData = data as PaginationResponseDto<BoxResponseDto>;
            boxes = paginatedData.list || [];
            totalElements = paginatedData.totalElements || 0;
          }

          const mappedBoxes = boxes.map((box) => this.mapBoxResponseToBox(box));

          return {
            list: mappedBoxes,
            totalElements: totalElements,
            totalPages: (data as PaginationResponseDto<BoxResponseDto>)?.totalPages || 1,
            currentPage: (data as PaginationResponseDto<BoxResponseDto>)?.currentPage || 1,
            size: (data as PaginationResponseDto<BoxResponseDto>)?.size || totalElements,
            hasNext: (data as PaginationResponseDto<BoxResponseDto>)?.hasNext || false,
            hasPrevious: (data as PaginationResponseDto<BoxResponseDto>)?.hasPrevious || false,
          };
        }),
        catchError(() => of({
          list: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          size: 0,
          hasNext: false,
          hasPrevious: false,
        }))
      );
  }

  override findById(id: string): Observable<Box | null> {
    return this.http
      .get<ResponseDTO<BoxResponseDto> | ResponseDto<BoxResponseDto>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return data ? this.mapBoxResponseToBox(data as BoxResponseDto) : null;
        }),
        catchError(() => of(null))
      );
  }

  override create(boxRequest: BoxRequestDto): Observable<Box> {
    return this.http
      .post<ResponseDTO<Box> | ResponseDto<Box>>(this.baseUrl, boxRequest, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return data || ({} as Box);
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  override update(id: string, boxRequest: BoxRequestDto): Observable<Box> {
    return this.http
      .put<ResponseDTO<BoxResponseDto> | ResponseDto<BoxResponseDto>>(`${this.baseUrl}/${id}`, boxRequest, this.getHeaders())
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return data ? this.mapBoxResponseToBox(data as BoxResponseDto) : ({} as Box);
        }),
        catchError((error) => {
          throw error;
        })
      );
  }

  override delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDTO<any> | ResponseDto<any>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response) => {
          if (response && 'success' in response) {
            return (response as ResponseDto<any>).success || false;
          }
          return true;
        }),
        catchError(() => of(false))
      );
  }

  findAvailableAddresses(): Observable<BoxAddress[]> {
    return this.http
      .get<ResponseDTO<BoxAddressResponseDto[]> | ResponseDto<BoxAddressResponseDto[]>>(
        `${this.baseUrl}/addresses`,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return data ? this.mapBoxAddressResponseToBoxAddress(data as BoxAddressResponseDto[]) : [];
        }),
        catchError(() => of([]))
      );
  }

  findAvailableMonitors(): Observable<MonitorsBoxMinResponseDto[]> {
    const apiUrl = this.env?.apiUrl || environment.apiUrl;
    return this.http
      .get<ResponseDTO<MonitorsBoxMinResponseDto[]> | ResponseDto<MonitorsBoxMinResponseDto[]>>(
        `${apiUrl}monitors`,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return Array.isArray(data) ? data : [];
        }),
        catchError(() => of([]))
      );
  }

  findMonitorsByIp(ip: string): Observable<Monitor[]> {
    const params = new HttpParams().set('ip', ip);
    return this.http
      .get<ResponseDTO<Monitor[]> | ResponseDto<Monitor[]>>(this.baseUrl, { ...this.getHeaders(), params })
      .pipe(
        map((response) => {
          const data = this.extractData(response);
          return Array.isArray(data) ? data : [];
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
