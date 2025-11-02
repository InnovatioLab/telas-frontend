import { Injectable, Inject } from "@angular/core";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { SubscriptionMinResponseDto } from "@app/model/dto/response/subscription-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { Subscription } from "@app/model/subscription";
import { Observable } from "rxjs";
import { ISubscriptionRepository } from "@app/core/interfaces/services/repository/subscription-repository.interface";
import { SUBSCRIPTION_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

export interface FilterSubscriptionRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
}

@Injectable({ providedIn: "root" })
export class SubscriptionService {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY_TOKEN) 
    private readonly repository: ISubscriptionRepository
  ) {}

  getClientSubscriptionsFilters(
    filters?: FilterSubscriptionRequestDto
  ): Observable<PaginationResponseDto<SubscriptionMinResponseDto>> {
    return this.repository.findWithPagination(filters);
  }

  checkout(): Observable<string> {
    return this.repository.checkout();
  }

  getById(id: string): Observable<Subscription> {
    return this.repository.findById(id);
  }

  upgrade(id: string, recurrence: Recurrence): Observable<string> {
    return this.repository.upgrade(id, recurrence);
  }

  renew(id: string): Observable<string> {
    return this.repository.renew(id);
  }

  getCustomerPortalUrl(): Observable<string> {
    return this.repository.getCustomerPortalUrl();
  }

  delete(id: string): Observable<boolean> {
    return this.repository.delete(id);
  }
}
