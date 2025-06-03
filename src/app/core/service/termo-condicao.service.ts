import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { TermoCondicao } from '@app/model/termo-condicao';

@Injectable({ providedIn: 'root' })
export class TermoCondicaoService {
  baseUrl = inject(ENVIRONMENT).apiUrl + 'terms_conditions';
  httpClient: HttpClient;
  headers = {
    headers: {
      Authorization: ''
    }
  };

  constructor() {
    this.httpClient = inject(HttpClient);
  }

  pegarTermoCondicao() {
    return this.httpClient
      .get<ResponseDTO<TermoCondicao>>(`${this.baseUrl}`)
      .pipe(map((res: ResponseDTO<TermoCondicao>) => res.data));
  }
}
