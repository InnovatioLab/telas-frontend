import { Observable } from 'rxjs';
import { Subscription } from '@app/model/subscription';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { SubscriptionMinResponseDto } from '@app/model/dto/response/subscription-response.dto';
import { Recurrence } from '@app/model/enums/recurrence.enum';
import { FilterSubscriptionRequestDto } from '@app/core/service/api/subscription.service';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface SubscriptionFilterDto extends FilterSubscriptionRequestDto, IBaseFilterDto {}

export interface ISubscriptionRepository extends IRepository<Subscription, any, any, SubscriptionFilterDto> {
  findWithPagination(filters?: FilterSubscriptionRequestDto): Observable<PaginationResponseDto<SubscriptionMinResponseDto>>;

  checkout(): Observable<string>;

  upgrade(id: string, recurrence: Recurrence): Observable<string>;

  renew(id: string): Observable<string>;

  getCustomerPortalUrl(): Observable<string>;
}
