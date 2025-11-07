import { Injectable, Inject } from "@angular/core";
import { Box } from "@app/model/box";
import { BoxAddress } from "@app/model/box-address";
import { BoxRequestDto } from "@app/model/dto/request/box-request.dto";
import { FilterBoxRequestDto } from "@app/model/dto/request/filter-box-request.dto";
import { MonitorsBoxMinResponseDto } from "@app/model/dto/response/monitor-box-min-response.dto";
import { PaginationResponseDto } from "@app/model/dto/response/pagination-response.dto";
import { Monitor } from "@app/model/monitors";
import { Observable } from "rxjs";
import { IBoxRepository } from "@app/core/interfaces/services/repository/box-repository.interface";
import { BOX_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

@Injectable({
  providedIn: "root",
})
export class BoxService {
  constructor(
    @Inject(BOX_REPOSITORY_TOKEN) 
    private readonly repository: IBoxRepository
  ) {}

  getAvailableBoxAddresses(): Observable<BoxAddress[]> {
    return this.repository.findAvailableAddresses();
  }

  getAvailableMonitors(): Observable<MonitorsBoxMinResponseDto[]> {
    return this.repository.findAvailableMonitors();
  }

  getBoxes(filters?: FilterBoxRequestDto): Observable<Box[]> {
    return this.repository.findAll(filters);
  }

  getBoxesWithPagination(filters?: FilterBoxRequestDto): Observable<PaginationResponseDto<Box>> {
    return this.repository.findWithPagination(filters);
  }

  getBoxById(id: string): Observable<Box | null> {
    return this.repository.findById(id);
  }

  createBox(boxRequest: BoxRequestDto): Observable<Box> {
    return this.repository.create(boxRequest);
  }

  updateBox(id: string, boxRequest: BoxRequestDto): Observable<Box> {
    return this.repository.update(id, boxRequest);
  }

  deleteBox(id: string): Observable<boolean> {
    return this.repository.delete(id);
  }

  getMonitorsAdsByIp(ip: string): Observable<Monitor[]> {
    return this.repository.findMonitorsByIp(ip);
  }
}
