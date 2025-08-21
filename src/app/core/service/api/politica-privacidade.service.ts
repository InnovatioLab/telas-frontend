import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ResponseDTO } from "@app/model/dto/response.dto";
import { PoliticaPrivacidade } from "@app/model/politica-privacidade";
import { map } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";

@Injectable({ providedIn: "root" })
export class PoliticaPrivacidadeService {
  baseUrl = inject(ENVIRONMENT).apiUrl + "privacy-policy";
  httpClient: HttpClient;
  headers = {
    headers: {
      Authorization: "",
    },
  };

  constructor() {
    this.httpClient = inject(HttpClient);
  }

  pegarPoliticaPrivacidade() {
    return this.httpClient
      .get<ResponseDTO<PoliticaPrivacidade>>(`${this.baseUrl}`)
      .pipe(map((res: ResponseDTO<PoliticaPrivacidade>) => res.data));
  }
}
