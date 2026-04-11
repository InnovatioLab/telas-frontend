import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ENVIRONMENT } from "src/environments/environment-token";
import {
  ApplicationLogEntry,
  MonitoringLogService,
} from "../monitoring-log.service";

describe("MonitoringLogService", () => {
  let service: MonitoringLogService;
  let httpMock: HttpTestingController;

  const mockEnv = {
    production: false,
    apiUrl: "http://localhost:8080/api/",
    emailSuporte: "",
    zipCodeApiKey: "k",
    googleMapsApiKey: "k",
    stripePublicKey: "k",
    stripePrivateKey: "k",
    nomeToken: "telas_token",
    nomeTokenRefresh: "r",
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MonitoringLogService,
        { provide: ENVIRONMENT, useValue: mockEnv },
      ],
    });
    service = TestBed.inject(MonitoringLogService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem("telas_token", "test-jwt");
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem("telas_token");
  });

  it("deve solicitar GET monitoring/logs com page, size e Authorization", (done) => {
    const payload = {
      list: [] as ApplicationLogEntry[],
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
    };

    service.getLogs({ page: 0, size: 20 }).subscribe((result) => {
      expect(result.list).toEqual([]);
      expect(result.totalRecords).toBe(0);
      expect(result.totalPages).toBe(0);
      done();
    });

    const req = httpMock.expectOne((r) =>
      r.url.startsWith("http://localhost:8080/api/monitoring/logs")
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("page")).toBe("0");
    expect(req.request.params.get("size")).toBe("20");
    expect(req.request.headers.get("Authorization")).toBe("Bearer test-jwt");

    req.flush({
      data: payload,
      status: 200,
      message: "ok",
    });
  });

  it("deve enviar filtros opcionais como query params", (done) => {
    service
      .getLogs({
        page: 1,
        size: 10,
        source: "BOX",
        level: "ERROR",
        q: "download",
        from: "2026-04-01T00:00:00Z",
        to: "2026-04-11T23:59:59Z",
      })
      .subscribe(() => done());

    const req = httpMock.expectOne((r) => {
      if (!r.url.startsWith("http://localhost:8080/api/monitoring/logs")) {
        return false;
      }
      const p = r.params;
      return (
        p.get("page") === "1" &&
        p.get("size") === "10" &&
        p.get("source") === "BOX" &&
        p.get("level") === "ERROR" &&
        p.get("q") === "download" &&
        p.get("from") === "2026-04-01T00:00:00Z" &&
        p.get("to") === "2026-04-11T23:59:59Z"
      );
    });
    req.flush({
      data: {
        list: [],
        totalRecords: 0,
        totalPages: 0,
        currentPage: 2,
      },
      status: 200,
      message: "ok",
    });
  });
});
