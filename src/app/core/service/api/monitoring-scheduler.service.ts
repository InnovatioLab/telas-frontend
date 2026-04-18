import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResponseDto } from "@app/model/dto/response/response.dto";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment.interface";

export interface SchedulerJobStatus {
  jobId: string;
  title: string;
  scheduleKind: string;
  cronExpression: string | null;
  zone: string | null;
  fixedDelayMillis: number | null;
  lastStartedAt: string | null;
  lastEndedAt: string | null;
  lastStatus: string | null;
  lastDurationMillis: number | null;
  nextExecutionEstimated: string | null;
  lastRunSummary: Record<string, unknown> | null;
}

@Injectable({
  providedIn: "root",
})
export class MonitoringSchedulerService {
  constructor(
    private readonly http: HttpClient,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly authentication: Authentication
  ) {}

  listJobs(): Observable<SchedulerJobStatus[]> {
    const headers = new HttpHeaders(this.getAuthHeaders());
    return this.http
      .get<ResponseDto<SchedulerJobStatus[]>>(
        `${this.env.apiUrl}monitoring/scheduler/jobs`,
        { headers }
      )
      .pipe(map((res) => res.data ?? []));
  }

  private getAuthHeaders(): Record<string, string> {
    const token =
      this.authentication.token ?? AuthenticationStorage.getToken();
    return {
      Authorization: `Bearer ${token || ""}`,
    };
  }
}
