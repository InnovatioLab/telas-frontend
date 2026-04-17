import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface AdminPermissionRow {
  clientId: string;
  businessName: string;
  email: string;
  grantedPermissions: string[];
}

export interface EmailAlertCategoryOption {
  code: string;
  labelEn: string;
}

export interface EmailAlertPreferences {
  preferences: Record<string, boolean>;
}

@Injectable({
  providedIn: "root",
})
export class DeveloperPermissionService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  listAdmins(): Observable<AdminPermissionRow[]> {
    return this.http
      .get<ResponseDto<AdminPermissionRow[]>>(
        `${this.env.apiUrl}developer/admins`,
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data ?? []));
  }

  permissionCatalog(): Observable<string[]> {
    return this.http
      .get<ResponseDto<string[]>>(
        `${this.env.apiUrl}developer/permissions/catalog`,
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data ?? []));
  }

  replacePermissions(clientId: string, permissions: string[]): Observable<void> {
    return this.http.put<void>(
      `${this.env.apiUrl}developer/clients/${clientId}/permissions`,
      { permissions },
      { headers: new HttpHeaders(this.getAuthHeaders()) }
    );
  }

  emailAlertCatalog(): Observable<EmailAlertCategoryOption[]> {
    return this.http
      .get<ResponseDto<EmailAlertCategoryOption[]>>(
        `${this.env.apiUrl}developer/email-alert-preferences/catalog`,
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data ?? []));
  }

  getEmailAlertPreferences(clientId: string): Observable<EmailAlertPreferences> {
    return this.http
      .get<ResponseDto<EmailAlertPreferences>>(
        `${this.env.apiUrl}developer/clients/${clientId}/email-alert-preferences`,
        { headers: new HttpHeaders(this.getAuthHeaders()) }
      )
      .pipe(map((res) => res.data ?? { preferences: {} }));
  }

  replaceEmailAlertPreferences(
    clientId: string,
    preferences: Record<string, boolean>
  ): Observable<void> {
    return this.http.put<void>(
      `${this.env.apiUrl}developer/clients/${clientId}/email-alert-preferences`,
      { preferences },
      { headers: new HttpHeaders(this.getAuthHeaders()) }
    );
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
      "Content-Type": "application/json",
    };
  }
}
