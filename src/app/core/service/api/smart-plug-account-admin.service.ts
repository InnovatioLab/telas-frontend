import { HttpClient, HttpParams } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface SmartPlugAccountDto {
  id: string;
  boxId: string;
  vendor: string;
  accountEmail: string | null;
  passwordConfigured: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SmartPlugAccountCreateRequest {
  boxId: string;
  vendor: string;
  accountEmail?: string | null;
  password?: string | null;
  enabled?: boolean | null;
}

export interface SmartPlugAccountUpdateRequest {
  accountEmail?: string | null;
  password?: string | null;
  enabled?: boolean | null;
}

@Injectable({
  providedIn: "root",
})
export class SmartPlugAccountAdminService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}

  listByBox(boxId: string): Observable<SmartPlugAccountDto[]> {
    const params = new HttpParams().set("boxId", boxId);
    return this.http
      .get<ResponseDto<SmartPlugAccountDto[]>>(
        `${this.env.apiUrl}monitoring/smart-plug-accounts`,
        { headers: this.headers(), params }
      )
      .pipe(map((res) => (res?.data as SmartPlugAccountDto[]) ?? []));
  }

  getById(id: string): Observable<SmartPlugAccountDto> {
    return this.http
      .get<ResponseDto<SmartPlugAccountDto>>(
        `${this.env.apiUrl}monitoring/smart-plug-accounts/${id}`,
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAccountDto));
  }

  create(body: SmartPlugAccountCreateRequest): Observable<SmartPlugAccountDto> {
    return this.http
      .post<ResponseDto<SmartPlugAccountDto>>(
        `${this.env.apiUrl}monitoring/smart-plug-accounts`,
        body,
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAccountDto));
  }

  update(
    id: string,
    body: SmartPlugAccountUpdateRequest
  ): Observable<SmartPlugAccountDto> {
    return this.http
      .put<ResponseDto<SmartPlugAccountDto>>(
        `${this.env.apiUrl}monitoring/smart-plug-accounts/${id}`,
        body,
        { headers: this.headers() }
      )
      .pipe(map((res) => res.data as SmartPlugAccountDto));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ResponseDto<unknown>>(
        `${this.env.apiUrl}monitoring/smart-plug-accounts/${id}`,
        { headers: this.headers() }
      )
      .pipe(map((): void => undefined));
  }

  private headers(): Record<string, string> {
    const token = localStorage.getItem("telas_token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}
