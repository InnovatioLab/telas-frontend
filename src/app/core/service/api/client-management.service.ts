import { Injectable, Inject } from '@angular/core';
import { Client } from "@app/model/client";
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { Observable } from 'rxjs';
import { IClientManagementRepository } from '@app/core/interfaces/services/repository/client-management-repository.interface';
import { CLIENT_MANAGEMENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';
import { AdminClientMessageRowDto } from '@app/model/dto/response/admin-client-message-row.dto';

export interface FilterClientRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
  includeInactiveRequests?: boolean;
}

export interface PermanentDeletionRequirementsDto {
  requiresMonitorSuccessor: boolean;
  monitorCount: number;
}

export interface PermanentDeleteClientPayload {
  password: string;
  monitorSuccessorClientId?: string | null;
}

export interface ClientResponseDto {
  id: string;
  businessName?: string;
  industry?: string;
  status?: any;
  contact?: {
    email?: string;
  };
  partnerAddressSummary?: string | null;
  role?: any;
  createdAt?: string;
  updatedAt?: string;
  ads?: unknown[];
  adsCount?: number;
  reactivatableByCurrentUser?: boolean;
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

  deactivateClient(clientId: string): Observable<void> {
    return this.repository.deactivateClient(clientId);
  }

  reactivateClient(clientId: string): Observable<void> {
    return this.repository.reactivateClient(clientId);
  }

  softDeleteClient(clientId: string): Observable<void> {
    return this.repository.softDeleteClient(clientId);
  }

  getPermanentDeletionRequirements(
    clientId: string
  ): Observable<PermanentDeletionRequirementsDto> {
    return this.repository.getPermanentDeletionRequirements(clientId);
  }

  permanentDeleteClient(clientId: string, payload: PermanentDeleteClientPayload): Observable<void> {
    return this.repository.permanentDeleteClient(clientId, payload);
  }

  listClientMessagesHistory(clientId: string): Observable<AdminClientMessageRowDto[]> {
    return this.repository.listClientMessagesHistory(clientId);
  }
} 