import { Observable } from 'rxjs';
import { Monitor } from '@app/model/monitors';
import { CreateMonitorRequestDto, UpdateMonitorRequestDto } from '@app/model/dto/request/create-monitor.request.dto';
import { FilterMonitorRequestDto } from '@app/model/dto/request/filter-monitor.request.dto';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';
import { IRepository } from './repository.interface';

export interface MonitorFilterDto extends FilterMonitorRequestDto, IBaseFilterDto {}

export interface IMonitorRepository extends IRepository<Monitor, CreateMonitorRequestDto, UpdateMonitorRequestDto, MonitorFilterDto> {
  findValidAds(monitorId: string): Observable<any[]>;
}
