import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IClientManagementRepository } from '@app/core/interfaces/services/repository/client-management-repository.interface';
import { Client } from '@app/model/client';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { FilterClientRequestDto, ClientResponseDto } from '@app/core/service/api/client-management.service';

@Injectable({ providedIn: 'root' })
export class ClientManagementRepositoryImpl implements IClientManagementRepository {
  private readonly baseUrl = `${environment.apiUrl}clients`;

  constructor(private readonly http: HttpClient) {}

  findWithPagination(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<Client>> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.size) params = params.set('size', filters.size.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortDir) params = params.set('sortDir', filters.sortDir);
      if (filters.genericFilter) params = params.set('genericFilter', filters.genericFilter);
    }
    
    params = params.set('_t', Date.now().toString());
    
    return this.http.get<ResponseDTO<PaginationResponseDto<ClientResponseDto>>>(`${this.baseUrl}/filters`, { params }).pipe(
      map((response: ResponseDTO<PaginationResponseDto<ClientResponseDto>>) => {
        if (response.data) {
          const clients: Client[] = (response.data.list || []).map(clientDto => ({
            id: clientDto.id,
            businessName: clientDto.businessName,
            industry: clientDto.industry,
            status: clientDto.status,
            contact: clientDto.contact,
            role: clientDto.role as any,
            createdAt: clientDto.createdAt,
            updatedAt: clientDto.updatedAt
          } as Client));
          
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

  makePartner(clientId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/partner/${clientId}`, {});
  }
}














