import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Box } from '@app/model/box';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { BoxResponseDto } from '@app/model/dto/response/box-response.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { Monitor } from '@app/model/monitors';

@Injectable({
  providedIn: 'root'
})
export class BoxService {
  private readonly apiUrl = environment.apiUrl + 'boxes';
  storageName = 'telas_token';
  token = localStorage.getItem(this.storageName);

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`
    }
  };

  constructor(private readonly http: HttpClient) { }

  getBoxes(filters?: FilterBoxRequestDto): Observable<Box[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
    }
    
    return this.http.get<ResponseDto<PaginationResponseDto<BoxResponseDto>>>(`${this.apiUrl}/filters`, { params, ...this.headers }).pipe(
      map((response: ResponseDto<PaginationResponseDto<BoxResponseDto>>) => {
        return response.data?.list?.map(box => this.mapBoxResponseToBox(box)) || [];
      }),
      catchError(error => {
        console.error('Error loading boxes:', error);
        return of([]);
      })
    );
  }

  getBoxesWithPagination(filters?: FilterBoxRequestDto): Observable<PaginationResponseDto<Box>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
      if (filters.active !== undefined) params = params.set('active', filters.active.toString());
    }
    
    return this.http.get<ResponseDto<PaginationResponseDto<BoxResponseDto>>>(`${this.apiUrl}/filters`, { params, ...this.headers }).pipe(
      map((response: ResponseDto<PaginationResponseDto<BoxResponseDto>>) => {
        const mappedBoxes = response.data?.list?.map(box => this.mapBoxResponseToBox(box)) || [];
        return {
          list: mappedBoxes,
          totalElements: response.data?.totalElements || 0,
          totalPages: response.data?.totalPages || 0,
          currentPage: response.data?.currentPage || 0,
          size: response.data?.size || 0,
          hasNext: response.data?.hasNext || false,
          hasPrevious: response.data?.hasPrevious || false
        };
      }),
      catchError(error => {
        console.error('Error loading boxes with pagination:', error);
        return of({
          list: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          size: 0,
          hasNext: false,
          hasPrevious: false
        });
      })
    );
  }

  getBoxById(id: string): Observable<Box | null> {
    return this.http.get<ResponseDto<BoxResponseDto>>(`${this.apiUrl}/${id}`, this.headers).pipe(
      map((response: ResponseDto<BoxResponseDto>) => {
        return response.data ? this.mapBoxResponseToBox(response.data) : null;
      }),
      catchError(error => {
        console.error('Error loading box by id:', error);
        return of(null);
      })
    );
  }

  createBox(boxRequest: BoxRequestDto): Observable<Box> {
    return this.http.post<ResponseDto<Box>>(this.apiUrl, boxRequest, this.headers).pipe(
      map((response: ResponseDto<Box>) => {
        return response.data || {} as Box;
      }),
      catchError(error => {
        console.error('Error creating box:', error);
        throw error;
      })
    );
  }

  updateBox(id: string, boxRequest: BoxRequestDto): Observable<Box> {
    return this.http.put<ResponseDto<BoxResponseDto>>(`${this.apiUrl}/${id}`, boxRequest, this.headers).pipe(
      map((response: ResponseDto<BoxResponseDto>) => {
        return response.data ? this.mapBoxResponseToBox(response.data) : {} as Box;
      }),
      catchError(error => {
        console.error('Error updating box:', error);
        throw error;
      })
    );
  }

  deleteBox(id: string): Observable<boolean> {
    return this.http.delete<ResponseDto<any>>(`${this.apiUrl}/${id}`, this.headers).pipe(
      map((response: ResponseDto<any>) => {
        return response.success || false;
      }),
      catchError(error => {
        console.error('Error deleting box:', error);
        return of(false);
      })
    );
  }

  getMonitorsAdsByIp(ip: string): Observable<Monitor[]> {
    let params = new HttpParams();
    params = params.set('ip', ip);
    
    return this.http.get<ResponseDto<Monitor[]>>(`${this.apiUrl}`, { params, ...this.headers }).pipe(
      map((response: ResponseDto<Monitor[]>) => {
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error loading monitors ads by IP:', error);
        return of([]);
      })
    );
  }

  private mapBoxResponseToBox(boxResponse: BoxResponseDto): Box {
    const box: Box = {
      id: boxResponse.id,
      ip: boxResponse.ip,
      monitorIds: boxResponse.monitorIds || [],
      active: boxResponse.active,
      createdAt: boxResponse.createdAt,
      updatedAt: boxResponse.updatedAt,
      monitorCount: boxResponse.monitorIds?.length || 0
    };
    
    return box;
  }
}
