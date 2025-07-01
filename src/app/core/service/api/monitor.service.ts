import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Monitor } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { environment } from 'src/environments/environment';
import { IMonitorAlert } from './interfaces/monitor';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { MonitorResponseDto } from '@app/model/dto/response/monitor-response.dto';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private readonly apiUrl = environment.apiUrl + 'monitors';
  storageName = 'telas_token';
  token = localStorage.getItem(this.storageName);

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`
    }
  };

  constructor(private readonly http: HttpClient) { }

  getMonitors(filters?: FilterMonitorRequestDto): Observable<Monitor[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
    }
    
    return this.http.get<ResponseDto<PaginationResponseDto<MonitorResponseDto>>>(`${this.apiUrl}/filters`, { params, ...this.headers }).pipe(
      map((response: ResponseDto<PaginationResponseDto<MonitorResponseDto>>) => {
        if (response?.data?.list) {
          return response.data.list.map(this.mapMonitorResponseToMonitor);
        }
        return [];
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  getMonitorsWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
    }
    
    return this.http.get<ResponseDto<PaginationResponseDto<MonitorResponseDto>>>(`${this.apiUrl}/filters`, { params, ...this.headers }).pipe(
      map((response: ResponseDto<PaginationResponseDto<MonitorResponseDto>>) => {
        if (response?.data) {
          const monitors = response.data.list.map(this.mapMonitorResponseToMonitor);
          const result = {
            list: monitors,
            totalElements: response.data.totalElements,
            totalPages: response.data.totalPages,
            currentPage: response.data.currentPage,
            size: response.data.size,
            hasNext: response.data.hasNext,
            hasPrevious: response.data.hasPrevious
          };
          return result;
        }
        
        return {
          list: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 1,
          size: filters?.size || 10,
          hasNext: false,
          hasPrevious: false
        };
      }),
      catchError(error => {
        return of({
          list: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 1,
          size: filters?.size || 10,
          hasNext: false,
          hasPrevious: false
        });
      })
    );
  }

  getMonitorById(id: string): Observable<Monitor | null> {
    return this.http.get<ResponseDto<MonitorResponseDto>>(`${this.apiUrl}/${id}`, this.headers).pipe(
      map((response: ResponseDto<MonitorResponseDto>) => {
        if (response?.data) {
          return this.mapMonitorResponseToMonitor(response.data);
        }
        return null;
      }),
      catchError(error => {
        return of(null);
      })
    );
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): Observable<Monitor> {
    return this.http.post<ResponseDto<Monitor>>(this.apiUrl, monitorRequest, this.headers).pipe(
      map((response: ResponseDto<Monitor>) => {
        if (response?.data) {
          return response.data;
        }
        throw new Error('API não retornou dados do monitor criado');
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  updateMonitor(id: string, monitorRequest: CreateMonitorRequestDto): Observable<Monitor> {
    return this.http.put<ResponseDto<MonitorResponseDto>>(`${this.apiUrl}/${id}`, monitorRequest, this.headers).pipe(
      map((response: ResponseDto<MonitorResponseDto>) => {
        if (response?.data) {
          return this.mapMonitorResponseToMonitor(response.data);
        }
        throw new Error('API não retornou dados do monitor atualizado');
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  deleteMonitor(id: string): Observable<boolean> {
    return this.http.delete<ResponseDto<any>>(`${this.apiUrl}/${id}`, this.headers).pipe(
      map((response: ResponseDto<any>) => {
        return true;
      }),
      catchError(error => {
        return of(false);
      })
    );
  }

  private mapMonitorResponseToMonitor(monitorResponse: MonitorResponseDto): Monitor {
    return {
      id: monitorResponse.id,
      name: monitorResponse.name || `Monitor ${monitorResponse.id}`,
      location: monitorResponse.location || monitorResponse.address?.city || 'Sem localização',
      status: monitorResponse.status || DefaultStatus.ACTIVE,
      lastUpdate: monitorResponse.lastUpdate || new Date(),
      type: monitorResponse.type,
      active: monitorResponse.active,
      locationDescription: monitorResponse.locationDescription || '',
      size: monitorResponse.size || 42.5,
      productId: monitorResponse.productId || `PROD-${monitorResponse.id}`,
      latitude: monitorResponse.address?.latitude,
      longitude: monitorResponse.address?.longitude,
      address: monitorResponse.address ? {
        id: monitorResponse.address.id,
        street: monitorResponse.address.street,
        city: monitorResponse.address.city,
        state: monitorResponse.address.state,
        country: monitorResponse.address.country,
        zipCode: monitorResponse.address.zipCode,
        complement: monitorResponse.address.complement,
        latitude: monitorResponse.address.latitude,
        longitude: monitorResponse.address.longitude,
        coordinatesParams: monitorResponse.address.latitude && monitorResponse.address.longitude 
          ? `${monitorResponse.address.latitude}, ${monitorResponse.address.longitude}`
          : undefined
      } : {
        id: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      createdAt: monitorResponse.createdAt,
      updatedAt: monitorResponse.updatedAt
    };
  }

  getMonitorAlerts(monitorId?: string): Observable<IMonitorAlert[]> {
    const mockAlerts: IMonitorAlert[] = [
      {
        id: '1',
        monitorId: '1',
        title: 'Display Panel Offline',
        description: 'Display panel #12345 has been offline for more than 24 hours.',
        timestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
        status: 'critical',
        deviceId: 'DP-12345'
      },
      {
        id: '2',
        monitorId: '2',
        title: 'Connectivity Issues',
        description: 'Panel #67890 is experiencing intermittent connectivity issues.',
        timestamp: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
        status: 'warning',
        deviceId: 'DP-67890'
      },
      {
        id: '3',
        monitorId: '3',
        title: 'Power Failure',
        description: 'Panel #54321 reported power supply issues before going offline.',
        timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
        status: 'critical',
        deviceId: 'DP-54321'
      },
      {
        id: '4',
        monitorId: '1',
        title: 'System Reboot Required',
        description: 'Panel #98765 requires a system reboot to apply security updates.',
        timestamp: new Date(new Date().getTime() - 18 * 60 * 60 * 1000),
        status: 'warning',
        deviceId: 'DP-98765'
      },
      {
        id: '5',
        monitorId: '2',
        title: 'Display Calibration Needed',
        description: 'Panel #24680 color calibration is out of expected range.',
        timestamp: new Date(new Date().getTime() - 36 * 60 * 60 * 1000),
        status: 'resolved',
        deviceId: 'DP-24680'
      },
      {
        id: '6',
        monitorId: '3',
        title: 'Network Connection Unstable',
        description: 'Panel #13579 is experiencing intermittent network connection issues.',
        timestamp: new Date(new Date().getTime() - 8 * 60 * 60 * 1000),
        status: 'acknowledged',
        deviceId: 'DP-13579',
        acknowledgeReason: 'Troubleshooting in progress, internet provider issue'
      }
    ];
    
    if (monitorId) {
      return of(mockAlerts.filter(alert => alert.monitorId === monitorId));
    }
    
    return of(mockAlerts);
  }
  
  acknowledgeAlert(alertId: string, reason: string): Observable<IMonitorAlert> {
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: '1',
      title: 'Alert Acknowledged',
      description: 'This alert has been acknowledged by an administrator',
      timestamp: new Date(),
      status: 'acknowledged',
      deviceId: 'DP-12345',
      acknowledgeReason: reason
    };
    
    return of(mockResponse);
  }
  
  resolveAlert(alertId: string): Observable<IMonitorAlert> {
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: '1',
      title: 'Alert Resolved',
      description: 'This alert has been marked as resolved',
      timestamp: new Date(),
      status: 'resolved',
      deviceId: 'DP-12345'
    };
    
    return of(mockResponse);
  }
}
