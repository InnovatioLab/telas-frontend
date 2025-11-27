import { Observable } from 'rxjs';
import { Subscription } from '@app/model/subscription';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { SubscriptionMinResponseDto } from '@app/model/dto/response/subscription-response.dto';
import { Recurrence } from '@app/model/enums/recurrence.enum';
import { FilterSubscriptionRequestDto } from '@app/core/service/api/subscription.service';

/**
 * Interface para operações de repositório de Subscription
 * Implementa o padrão Repository para desacoplar a lógica de acesso a dados
 */
export interface ISubscriptionRepository {
  /**
   * Busca subscriptions com paginação e filtros
   * @param filters - Filtros de paginação e busca
   * @returns Observable com paginação de subscriptions
   */
  findWithPagination(filters?: FilterSubscriptionRequestDto): Observable<PaginationResponseDto<SubscriptionMinResponseDto>>;

  /**
   * Cria checkout para nova subscription
   * @returns Observable com URL de checkout
   */
  checkout(): Observable<string>;

  /**
   * Busca subscription por ID
   * @param id - ID da subscription
   * @returns Observable com subscription encontrada
   */
  findById(id: string): Observable<Subscription | null>;

  /**
   * Faz upgrade de subscription
   * @param id - ID da subscription
   * @param recurrence - Nova recorrência
   * @returns Observable com URL de checkout
   */
  upgrade(id: string, recurrence: Recurrence): Observable<string>;

  /**
   * Renova subscription
   * @param id - ID da subscription
   * @returns Observable com URL de checkout
   */
  renew(id: string): Observable<string>;

  /**
   * Busca URL do customer portal
   * @returns Observable com URL do portal
   */
  getCustomerPortalUrl(): Observable<string>;

  /**
   * Remove subscription
   * @param id - ID da subscription
   * @returns Observable com boolean indicando sucesso
   */
  delete(id: string): Observable<boolean>;
}














