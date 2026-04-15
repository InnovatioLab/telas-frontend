import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { ISubscriptionRepository } from '@app/core/interfaces/services/repository/subscription-repository.interface';
import { Subscription } from '@app/model/subscription';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { ResponseDto } from '@app/model/dto/response/response.dto';
import { SubscriptionMinResponseDto, SubscriptionResponseDto, SubscriptionMonitorResponseDto } from '@app/model/dto/response/subscription-response.dto';
import { PaymentResponseDto } from '@app/model/dto/response/payment-response.dto';
import { Payment } from '@app/model/payment';
import { Monitor } from '@app/model/monitors';
import { Recurrence } from '@app/model/enums/recurrence.enum';
import { FilterSubscriptionRequestDto } from '@app/core/service/api/subscription.service';
import { BaseRepository } from './base.repository';
import { ENVIRONMENT } from 'src/environments/environment-token';

@Injectable({ providedIn: 'root' })
export class SubscriptionRepositoryImpl extends BaseRepository<Subscription, any, any> implements ISubscriptionRepository {
  constructor(
    httpClient: HttpClient,
    @Optional() @Inject(ENVIRONMENT) env?: any
  ) {
    super(httpClient, 'subscriptions', env);
  }

  override findWithPagination(filters?: FilterSubscriptionRequestDto): Observable<PaginationResponseDto<SubscriptionMinResponseDto>> {
    const params = this.createFilterParams(filters);

    return this.http
      .get<ResponseDTO<PaginationResponseDto<SubscriptionMinResponseDto>>>(
        `${this.baseUrl}/filters`,
        { ...this.getHeaders(), params }
      )
      .pipe(
        map((response: ResponseDTO<PaginationResponseDto<SubscriptionMinResponseDto>>) => {
          if (response.data) {
            const subscriptions: SubscriptionMinResponseDto[] = response.data.list || [];

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
        })
      );
  }

  override findAll(): Observable<Subscription[]> {
    return this.findWithPagination().pipe(
      map((paginated) => paginated.list as any),
      catchError(() => of([]))
    );
  }

  override findById(id: string): Observable<Subscription | null> {
    return this.http
      .get<ResponseDto<SubscriptionResponseDto>>(`${this.baseUrl}/${id}`, this.getHeaders())
      .pipe(
        map((response: ResponseDto<SubscriptionResponseDto>) => {
          return response.data
            ? this.mapSubscriptionResponseToSubscription(response.data)
            : null;
        })
      );
  }

  override delete(id: string): Observable<boolean> {
    return this.http
      .delete<ResponseDto<any>>(`${this.baseUrl}/${id}`, this.getHeaders())
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

  checkout(): Observable<string> {
    return this.http
      .post<ResponseDto<string>>(`${this.baseUrl}`, null, this.getHeaders())
      .pipe(map((response: ResponseDto<string>) => response.data));
  }

  upgrade(id: string, recurrence: Recurrence): Observable<string> {
    return this.http
      .patch<ResponseDto<string>>(
        `${this.baseUrl}/upgrade/${id}?recurrence=${recurrence}`,
        {},
        this.getHeaders()
      )
      .pipe(map((response: ResponseDto<string>) => response.data));
  }

  renew(id: string): Observable<string> {
    return this.http
      .patch<ResponseDto<string>>(`${this.baseUrl}/renew/${id}`, {}, this.getHeaders())
      .pipe(map((response: ResponseDto<string>) => response.data));
  }

  getCustomerPortalUrl(): Observable<string> {
    return this.http
      .get<ResponseDto<string>>(`${this.baseUrl}/customer-portal`, this.getHeaders())
      .pipe(map((response: ResponseDto<string>) => response.data));
  }

  override create(): Observable<Subscription> {
    return this.checkout().pipe(map(() => ({} as Subscription)));
  }

  override update(): Observable<Subscription> {
    return of({} as Subscription);
  }

  private mapSubscriptionResponseToSubscription(response: SubscriptionResponseDto): Subscription {
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

  private getMonitorsFromResponse(monitors: SubscriptionMonitorResponseDto[]): Monitor[] {
    return monitors.map((monitor) => ({
      id: monitor.id,
      addressData: monitor.addressData,
    } as any));
  }
}
