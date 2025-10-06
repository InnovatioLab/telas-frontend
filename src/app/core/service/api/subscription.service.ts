import { HttpBackend, HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ResponseDTO } from "@app/model/dto/response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { PaymentResponseDto } from "@app/model/dto/response/payment-response.dto";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import {
  SubscriptionMinResponseDto,
  SubscriptionMonitorResponseDto,
  SubscriptionResponseDto,
} from "@app/model/dto/response/subscription-response.dto";
import { Recurrence } from "@app/model/enums/recurrence.enum";
import { Monitor } from "@app/model/monitors";
import { Payment } from "@app/model/payment";
import { Subscription } from "@app/model/subscription";
import { catchError, map, Observable, of } from "rxjs";
import { environment } from "src/environments/environment";

export interface FilterSubscriptionRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
}

@Injectable({ providedIn: "root" })
export class SubscriptionService {
  private readonly apiUrl = environment.apiUrl + "subscriptions";

  storageName = "telas_token";
  token = localStorage.getItem(this.storageName);
  httpBackend = new HttpClient(inject(HttpBackend));

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  getClientSubscriptionsFilters(
    filters?: FilterSubscriptionRequestDto
  ): Observable<PaginationResponseDto<SubscriptionMinResponseDto>> {
    let params = new HttpParams();

    if (filters) {
      if (filters.page) params = params.set("page", filters.page.toString());
      if (filters.size) params = params.set("size", filters.size.toString());
      if (filters.sortBy) params = params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params = params.set("sortDir", filters.sortDir);
      if (filters.genericFilter)
        params = params.set("genericFilter", filters.genericFilter);
    }

    return this.http
      .get<
        ResponseDTO<PaginationResponseDto<SubscriptionMinResponseDto>>
      >(`${this.apiUrl}/filters`, { params, ...this.headers })
      .pipe(
        map(
          (
            response: ResponseDTO<
              PaginationResponseDto<SubscriptionMinResponseDto>
            >
          ) => {
            if (response.data) {
              const subscriptions: SubscriptionMinResponseDto[] =
                response.data.list || [];

              return {
                list: subscriptions,
                totalElements:
                  response.data.totalElements && response.data.totalElements > 0
                    ? response.data.totalElements
                    : subscriptions.length,
                totalPages: response.data.totalPages || 0,
                currentPage: response.data.currentPage || 0,
                size: response.data.size || 0,
                hasNext: response.data.hasNext || false,
                hasPrevious: response.data.hasPrevious || false,
              };
            }
            return {
              list: [],
              totalElements: 0,
              totalPages: 0,
              currentPage: 0,
              size: 0,
              hasNext: false,
              hasPrevious: false,
            };
          }
        )
      );
  }

  checkout(): Observable<string> {
    return this.http
      .post<ResponseDto<string>>(`${this.apiUrl}`, null, this.headers)
      .pipe(
        map((response: ResponseDto<string>) => {
          return response.data;
        })
      );
  }

  getById(id: string): Observable<Subscription> {
    return this.http
      .get<
        ResponseDto<SubscriptionResponseDto>
      >(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<SubscriptionResponseDto>) => {
          return response.data
            ? this.mapSubscriptionResponseToSubscription(response.data)
            : null;
        })
      );
  }

  upgrade(id: string, recurrence: Recurrence): Observable<string> {
    return this.http
      .patch<
        ResponseDto<string>
      >(`${this.apiUrl}/upgrade/${id}?recurrence=${recurrence}`, {}, this.headers)
      .pipe(
        map((response: ResponseDto<string>) => {
          return response.data;
        })
      );
  }

  renew(id: string): Observable<string> {
    return this.http
      .patch<
        ResponseDto<string>
      >(`${this.apiUrl}/renew/${id}`, {}, this.headers)
      .pipe(
        map((response: ResponseDto<string>) => {
          return response.data;
        })
      );
  }

  getCustomerPortalUrl(): Observable<string> {
    return this.http
      .get<
        ResponseDto<string>
      >(`${this.apiUrl}/customer-portal`, this.headers)
      .pipe(
        map((response: ResponseDto<string>) => {
          return response.data;
        })
      );
  }

  delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDto<any>>(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response: ResponseDto<any>) => {
          if (response) {
            return true;
          }
          return false;
        }),
        catchError((error) => {
          return of(false);
        })
      );
  }

  private mapSubscriptionResponseToSubscription(
    response: SubscriptionResponseDto
  ): Subscription {
    return {
      id: response.id,
      recurrence: response.recurrence,
      bonus: response.bonus,
      status: response.status,
      payments: this.getPaymentsFromResponse(response.payments),
      monitors: this.getMonitorsFromResponse(response.monitors),
      startedAt: response.startedAt,
      endsAt: response.endsAt,
    };
  }

  private getPaymentsFromResponse(payments: PaymentResponseDto[]): Payment[] {
    return payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      currency: payment.currency,
      status: payment.status,
    }));
  }

  private getMonitorsFromResponse(
    monitors: SubscriptionMonitorResponseDto[]
  ): Monitor[] {
    return monitors.map((monitor) => ({
      id: monitor.id,
      type: monitor.type,
      size: monitor.size,
      addressData: monitor.addressData,
    }));
  }
}
