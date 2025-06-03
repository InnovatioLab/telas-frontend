import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IDocumentoDistribuicao } from '@app/model/dto/documento-distribuicao';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AutenticacaoStorage } from './guard';

@Injectable({
  providedIn: 'root',
})
export class PainelInicialService {
  urlApi: string = environment.urlApi;
  httpClient: HttpClient;
  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  private autenticado = { Authorization: `Bearer ${AutenticacaoStorage.getToken()}` };

  pegaDistribuicaoDocumentos(): Observable<IDocumentoDistribuicao[]> {
    const headers = { headers: { ...this.autenticado } };
    return this.httpClient.get<IDocumentoDistribuicao[]>(
      `${this.urlApi}files/resume-list`,
      headers
    );
  }
}
