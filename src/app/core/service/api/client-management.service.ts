import { Injectable, Inject } from '@angular/core';
import { Client } from "@app/model/client";
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { Observable } from 'rxjs';
import { IClientManagementRepository } from '@app/core/interfaces/services/repository/client-management-repository.interface';
import { CLIENT_MANAGEMENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';

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
  industry?: string;
  status?: any;
  contact?: {
    email?: string;
  };
  role?: any;
  createdAt?: string;
  updatedAt?: string;
  ads?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientManagementService {
  constructor(
    @Inject(CLIENT_MANAGEMENT_REPOSITORY_TOKEN) 
    private readonly repository: IClientManagementRepository
  ) {}

  getClientsWithPagination(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<Client>> {
    return this.repository.findWithPagination(filters);
  }

  makePartner(clientId: string): Observable<void> {
    return this.repository.makePartner(clientId);
  }
} 