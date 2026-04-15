import { Inject, Injectable } from "@angular/core";
import { Page } from "@app/model/dto/page.dto";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { Observable } from "rxjs";
import { IAdRepository } from "@app/core/interfaces/services/repository/ad-repository.interface";
import { AD_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

@Injectable({
  providedIn: "root",
})
export class AdService {
  constructor(
    @Inject(AD_REPOSITORY_TOKEN) private readonly repository: IAdRepository
  ) {}

  getPendingAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    return this.repository.getPendingAds(page, size);
  }

  getApprovedAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    return this.repository.getApprovedAds(page, size);
  }

  getRejectedAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    return this.repository.getRejectedAds(page, size);
  }

  getAllAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    return this.repository.getAllAds(page, size);
  }

  createClientAd(clientId: string, dto: CreateClientAdDto): Observable<any> {
    return this.repository.createClientAd(clientId, dto);
  }
}
