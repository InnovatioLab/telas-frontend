import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { catchError, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class BoxService {
  private readonly apiUrl = environment.apiUrl + "notifications";
  storageName = "telas_token";
  token = localStorage.getItem(this.storageName);

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
  };

  constructor(private readonly http: HttpClient) {}

  getClientNotifications(request?: string[]): Observable<Notification[]> {
    const params = request ? { params: { ids: request.join(",") } } : {};

    return this.http
      .get<
        ResponseDto<Notification[]>
      >(`${this.apiUrl}`, { ...this.headers, ...params })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error("Error fetching notifications:", error);
          return of(null);
        })
      );
  }

  findById(id: string): Observable<Notification | null> {
    return this.http
      .get<ResponseDto<Notification>>(`${this.apiUrl}/${id}`, this.headers)
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error("Error fetching notification:", error);
          return of(null);
        })
      );
  }
}
