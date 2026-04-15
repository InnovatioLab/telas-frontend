import { Observable } from 'rxjs';
import { AdResponseDto } from '@app/model/dto/response/ad-response.dto';
import { CreateClientAdDto } from '@app/model/dto/request/create-client-ad.dto';
import { Page } from '@app/model/dto/page.dto';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface AdFilterDto extends IBaseFilterDto {}

export interface IAdRepository extends IRepository<AdResponseDto, CreateClientAdDto, CreateClientAdDto, AdFilterDto> {
  getPendingAds(page?: number, size?: number): Observable<Page<AdResponseDto>>;
  getApprovedAds(page?: number, size?: number): Observable<Page<AdResponseDto>>;
  getRejectedAds(page?: number, size?: number): Observable<Page<AdResponseDto>>;
  getAllAds(page?: number, size?: number): Observable<Page<AdResponseDto>>;
  createClientAd(clientId: string, dto: CreateClientAdDto): Observable<any>;
}

