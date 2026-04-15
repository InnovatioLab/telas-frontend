import { Observable } from 'rxjs';
import { Box } from '@app/model/box';
import { BoxAddress } from '@app/model/box-address';
import { BoxRequestDto } from '@app/model/dto/request/box-request.dto';
import { FilterBoxRequestDto } from '@app/model/dto/request/filter-box-request.dto';
import { PaginationResponseDto } from '@app/model/dto/response/pagination-response.dto';
import { MonitorsBoxMinResponseDto } from '@app/model/dto/response/monitor-box-min-response.dto';
import { Monitor } from '@app/model/monitors';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface BoxFilterDto extends FilterBoxRequestDto, IBaseFilterDto {}

export interface IBoxRepository extends IRepository<Box, BoxRequestDto, BoxRequestDto, BoxFilterDto> {
  findAvailableAddresses(): Observable<BoxAddress[]>;

  findAvailableMonitors(): Observable<MonitorsBoxMinResponseDto[]>;

  findMonitorsByIp(ip: string): Observable<Monitor[]>;
}
