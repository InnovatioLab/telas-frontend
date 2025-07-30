import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Page } from "@app/model/dto/page.dto";
import { CreateClientAdDto } from "@app/model/dto/request/create-client-ad.dto";
import { ResponseDTO } from "@app/model/dto/response.dto";
import { AdResponseDto } from "@app/model/dto/response/ad-response.dto";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class AdService {
  private readonly baseUrl = `${environment.apiUrl}ads`;

  constructor(private http: HttpClient) {}

  getPendingAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<
        ResponseDTO<Page<AdResponseDto>>
      >(`${this.baseUrl}/pending-ads`, { params })
      .pipe(map((response) => response.data));
  }

  getApprovedAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<
        ResponseDTO<Page<AdResponseDto>>
      >(`${this.baseUrl}/approved-ads`, { params })
      .pipe(map((response) => response.data));
  }

  getRejectedAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<
        ResponseDTO<Page<AdResponseDto>>
      >(`${this.baseUrl}/rejected-ads`, { params })
      .pipe(map((response) => response.data));
  }

  getAllAds(
    page: number = 0,
    size: number = 10
  ): Observable<Page<AdResponseDto>> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString());

    return this.http
      .get<ResponseDTO<Page<AdResponseDto>>>(`${this.baseUrl}/all`, { params })
      .pipe(map((response) => response.data));
  }

  createClientAd(clientId: string, dto: CreateClientAdDto): Observable<any> {
    return this.http.post(`${environment.apiUrl}clients/ads/${clientId}`, dto);
  }
}
