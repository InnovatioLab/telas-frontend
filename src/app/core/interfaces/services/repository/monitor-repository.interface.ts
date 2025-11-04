import { Observable } from 'rxjs';
import { Monitor } from '@app/model/monitors';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';

export interface IMonitorRepository {
  findWithPagination(filters?: FilterMonitorRequestDto): Observable<PaginationResponseDto<Monitor>>;
  findById(id: string): Observable<Monitor | null>;
  create(request: CreateMonitorRequestDto): Observable<boolean>;
  update(id: string, request: UpdateMonitorRequestDto): Observable<boolean>;
  delete(id: string): Observable<boolean>;
  findValidAds(monitorId: string): Observable<any[]>;
}


