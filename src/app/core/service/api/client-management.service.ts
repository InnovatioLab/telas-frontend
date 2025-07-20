import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { Client } from '@app/model/client';

export interface FilterClientRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
}

export interface ClientResponseDto {
  id: string;
  businessName?: string;
  owner?: {
    name?: string;
    email?: string;
  };
  contact?: {
    email?: string;
  };
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientManagementService {
  private readonly apiUrl = `${environment.apiUrl}clients`;

  constructor(private readonly http: HttpClient) {}

  getClientsWithPagination(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<Client>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
    }
    
    params = params.set('_t', Date.now().toString());
    
    return this.http.get<ResponseDTO<PaginationResponseDto<ClientResponseDto>>>(`${this.apiUrl}/filters`, { params }).pipe(
      map((response: ResponseDTO<PaginationResponseDto<ClientResponseDto>>) => {
        if (response.data) {
          const clients: Client[] = (response.data.list || []).map(clientDto => ({
            id: clientDto.id,
            businessName: clientDto.businessName,
            owner: clientDto.owner,
            contact: clientDto.contact,
            role: clientDto.role as any,
            createdAt: clientDto.createdAt,
            updatedAt: clientDto.updatedAt
          }));
          
          return {
            list: clients,
            totalElements: (response.data.totalElements && response.data.totalElements > 0) ? response.data.totalElements : clients.length,
            totalPages: response.data.totalPages || 0,
            currentPage: response.data.currentPage || 0,
            size: response.data.size || 0,
            hasNext: response.data.hasNext || false,
            hasPrevious: response.data.hasPrevious || false
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
      })
    );
  }

  makePartner(clientId: string): Observable<Client> {
    return this.http.patch<ResponseDTO<ClientResponseDto>>(`${this.apiUrl}/partner/${clientId}`, {}).pipe(
      map((response: ResponseDTO<ClientResponseDto>) => {
        if (response.data) {
          const client: Client = {
            id: response.data.id,
            businessName: response.data.businessName,
            owner: response.data.owner,
            contact: response.data.contact,
            role: response.data.role as any
          };
          return client;
        }
        throw new Error('Failed to make client partner');
      })
    );
  }
} 