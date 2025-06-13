import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { environment } from 'src/environments/environment';
import { IMonitorAlert } from './interfaces/monitor';
import { CreateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';

@Injectable({
  providedIn: 'root'
})
export class MonitorService {
  private readonly apiUrl = environment.apiUrl + '/monitors';

  constructor(private readonly http: HttpClient) { }

  getMonitors(searchTerm?: string): Observable<Monitor[]> {
    console.log('Buscando monitores, termo de busca:', searchTerm);
    const mockData: Monitor[] = [
      { 
        id: '1', 
        name: 'Monitor Central', 
        location: 'Downtown', 
        status: DefaultStatus.ACTIVE, 
        lastUpdate: new Date(),
        type: MonitorType.BASIC,
        active: true,
        locationDescription: 'Central Business District',
        size: 42.5,
        productId: 'PROD-001',
        maxBlocks: 12,
        address: {
          id: '101',
          street: 'Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        }
      },
      { 
        id: '2', 
        name: 'Monitor East Side', 
        location: 'East Side', 
        status: DefaultStatus.INACTIVE, 
        lastUpdate: new Date(),
        type: MonitorType.PREMIUM,
        active: false,
        locationDescription: 'East Side Mall',
        size: 55.0,
        productId: 'PROD-002',
        maxBlocks: 24,
        address: {
          id: '102',
          street: 'Broadway',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10002'
        }
      },
      { 
        id: '3', 
        name: 'Monitor West Wing', 
        location: 'West Wing', 
        status: DefaultStatus.ACTIVE, 
        lastUpdate: new Date(),
        type: MonitorType.ADVANCED,
        active: true,
        locationDescription: 'West Wing Shopping Center',
        size: 65.0,
        productId: 'PROD-003',
        maxBlocks: 36,
        address: {
          id: '103',
          street: '5th Avenue',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10003'
        }
      }
    ];

    if (searchTerm) {
      const filtered = mockData.filter(monitor => 
        monitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monitor.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        monitor.type.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      return of(filtered);
    }

    return of(mockData);
    
    // Chamada real para a API (descomentar em produção)
    // let url = this.apiUrl;
    // if (searchTerm) {
    //   url += `?search=${searchTerm}`;
    // }
    // return this.http.get<Monitor[]>(url).pipe(
    //   catchError(error => {
    //     console.error('Erro ao buscar monitores:', error);
    //     return of([]);
    //   })
    // );
  }

  getMonitorById(id: string): Observable<Monitor | null> {
    console.log('Buscando monitor por ID:', id);
    
    const mockData: Monitor = {
      id,
      name: 'Monitor ' + id,
      location: 'Location ' + id,
      status: DefaultStatus.ACTIVE,
      lastUpdate: new Date(),
      type: MonitorType.BASIC,
      active: true,
      locationDescription: 'Location Description ' + id,
      size: 55.0,
      productId: 'PROD-' + id,
      maxBlocks: 12,
      address: {
        id: '10' + id,
        street: 'Street ' + id,
        city: 'City ' + id,
        state: 'State ' + id,
        country: 'Country ' + id,
        zipCode: '1000' + id
      }
    };
    
    return of(mockData);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.get<Monitor>(`${this.apiUrl}/${id}`).pipe(
    //   catchError(error => {
    //     console.error(`Erro ao buscar monitor com ID ${id}:`, error);
    //     return of(null);
    //   })
    // );
  }

  createMonitor(monitorRequest: CreateMonitorRequestDto): Observable<Monitor> {
    console.log('Criando novo monitor:', monitorRequest);
    
    const newMonitor: Monitor = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Monitor ${monitorRequest.productId}`,
      location: monitorRequest.address?.city || 'Sem localização',
      status: DefaultStatus.ACTIVE,
      lastUpdate: new Date(),
      type: monitorRequest.type,
      active: monitorRequest.active,
      locationDescription: monitorRequest.locationDescription || '',
      size: monitorRequest.size,
      productId: monitorRequest.productId,
      maxBlocks: monitorRequest.maxBlocks,
      address: {
        id: monitorRequest.addressId || Math.random().toString(36).substring(2, 9),
        street: monitorRequest.address.street,
        city: monitorRequest.address.city,
        state: monitorRequest.address.state,
        country: monitorRequest.address.country,
        zipCode: monitorRequest.address.zipCode
      }
    };
    
    return of(newMonitor);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.post<Monitor>(this.apiUrl, monitorRequest).pipe(
    //   catchError(error => {
    //     console.error('Erro ao criar monitor:', error);
    //     throw error;
    //   })
    // );
  }

  updateMonitor(id: string, monitor: Partial<Monitor>): Observable<Monitor> {
    console.log('Atualizando monitor:', id, monitor);
    
    const updatedMonitor: Monitor = {
      id,
      name: monitor.name || 'Monitor ' + id,
      location: monitor.location || 'Location ' + id,
      status: monitor.status || DefaultStatus.ACTIVE,
      lastUpdate: new Date(),
      type: monitor.type || MonitorType.BASIC,
      active: monitor.active ?? true,
      locationDescription: monitor.locationDescription || 'Location Description ' + id,
      size: monitor.size || 55.0,
      productId: monitor.productId || 'PROD-' + id,
      maxBlocks: monitor.maxBlocks || 12,
      address: monitor.address || {
        id: '10' + id,
        street: 'Street ' + id,
        city: 'City ' + id,
        state: 'State ' + id,
        country: 'Country ' + id,
        zipCode: '1000' + id
      }
    };
    
    return of(updatedMonitor);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.put<Monitor>(`${this.apiUrl}/${id}`, monitor).pipe(
    //   catchError(error => {
    //     console.error(`Erro ao atualizar monitor com ID ${id}:`, error);
    //     throw error;
    //   })
    // );
  }

  deleteMonitor(id: string): Observable<boolean> {
    console.log('Excluindo monitor:', id);
    
    return of(true);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
    //   map(() => true),
    //   catchError(error => {
    //     console.error(`Erro ao excluir monitor com ID ${id}:`, error);
    //     return of(false);
    //   })
    // );
  }

  getMonitorAlerts(monitorId?: string): Observable<IMonitorAlert[]> {
    console.log('Buscando alertas, monitor ID:', monitorId);
    
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
    
    // Chamada real para a API (descomentar em produção)
    // let url = `${this.apiUrl}/alerts`;
    // if (monitorId) {
    //   url += `?monitorId=${monitorId}`;
    // }
    // return this.http.get<MonitorAlert[]>(url).pipe(
    //   catchError(error => {
    //     console.error('Erro ao buscar alertas:', error);
    //     return of([]);
    //   })
    // );
  }
  
  acknowledgeAlert(alertId: string, reason: string): Observable<IMonitorAlert> {
    console.log('Confirmando alerta:', alertId, 'com razão:', reason);
    
    // Implementação mock
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: '1', // Valor arbitrário para mock
      title: 'Alert Acknowledged',
      description: 'This alert has been acknowledged by an administrator',
      timestamp: new Date(),
      status: 'acknowledged',
      deviceId: 'DP-12345',
      acknowledgeReason: reason
    };
    
    return of(mockResponse);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.post<MonitorAlert>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, { reason }).pipe(
    //   catchError(error => {
    //     console.error('Erro ao confirmar alerta:', error);
    //     throw error;
    //   })
    // );
  }
  
  resolveAlert(alertId: string): Observable<IMonitorAlert> {
    console.log('Resolvendo alerta:', alertId);
    
    // Implementação mock
    const mockResponse: IMonitorAlert = {
      id: alertId,
      monitorId: '1', // Valor arbitrário para mock
      title: 'Alert Resolved',
      description: 'This alert has been marked as resolved',
      timestamp: new Date(),
      status: 'resolved',
      deviceId: 'DP-12345'
    };
    
    return of(mockResponse);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.post<MonitorAlert>(`${this.apiUrl}/alerts/${alertId}/resolve`, {}).pipe(
    //   catchError(error => {
    //     console.error('Erro ao resolver alerta:', error);
    //     throw error;
    //   })
    // );
  }
}
