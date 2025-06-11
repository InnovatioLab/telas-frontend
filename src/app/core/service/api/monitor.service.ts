import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Monitor, MonitorType } from '@app/model/monitors';
import { DefaultStatus } from '@app/model/client';
import { environment } from 'src/environments/environment';

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

  createMonitor(monitor: Omit<Monitor, 'id'>): Observable<Monitor> {
    console.log('Criando novo monitor:', monitor);
    
    const newMonitor: Monitor = {
      ...monitor,
      id: Math.random().toString(36).substring(2, 9),
      lastUpdate: new Date()
    };
    
    return of(newMonitor);
    
    // Chamada real para a API (descomentar em produção)
    // return this.http.post<Monitor>(this.apiUrl, monitor).pipe(
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
      active: monitor.active !== undefined ? monitor.active : true,
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
}
