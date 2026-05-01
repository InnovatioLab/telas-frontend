import { Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import {
  FilterClientRequestDto,
  PermanentDeletionRequirementsDto,
  PermanentDeleteClientPayload,
} from '@app/core/service/api/client-management.service';
import { AdminClientMessageRowDto } from '@app/model/dto/response/admin-client-message-row.dto';

/**
 * Interface para operações de repositório de Gerenciamento de Clientes
 * Implementa o padrão Repository para desacoplar a lógica de acesso a dados
 */
export interface IClientManagementRepository {
  /**
   * Busca clientes com paginação e filtros
   * @param filters - Filtros de paginação e busca
   * @returns Observable com paginação de clientes
   */
  findWithPagination(filters?: FilterClientRequestDto): Observable<PaginationResponseDto<Client>>;

  /**
   * Torna um cliente parceiro
   * @param clientId - ID do cliente
   * @returns Observable vazio
   */
  makePartner(clientId: string): Observable<void>;

  deactivateClient(clientId: string): Observable<void>;

  reactivateClient(clientId: string): Observable<void>;

  softDeleteClient(clientId: string): Observable<void>;

  getPermanentDeletionRequirements(
    clientId: string
  ): Observable<PermanentDeletionRequirementsDto>;

  permanentDeleteClient(clientId: string, payload: PermanentDeleteClientPayload): Observable<void>;

  listClientMessagesHistory(clientId: string): Observable<AdminClientMessageRowDto[]>;
}
