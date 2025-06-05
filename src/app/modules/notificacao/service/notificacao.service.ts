import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, } from 'rxjs';
import { NotificacaoResponse } from '../models/response/notificacao.response';
import { ResponseDTO } from '../models/response/response.dto';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { AuthenticationStorage } from '@app/core/service/auth/authentication-storage';

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  baseUrl = inject(ENVIRONMENT).apiUrl + 'notificacao';
  httpClient: HttpClient;

  private readonly autenticado = { Authorization: `Bearer ${AuthenticationStorage.getToken()}` };
  private readonly ignorarLoadingInterceptor = { 'Ignorar-Loading-Interceptor': 'true' };
  private readonly ignorarErrorInterceptor = { 'Ignorar-Error-Interceptor': 'true' };


  constructor() {
    this.httpClient = inject(HttpClient);
  }

  MOCK_MENSAGEM = `
          <div class="informacoes">
              <h4 id="test-titulo-notificacao" class="titulo-notificacao">Produto Aguardando Validação!</h4>
              <div class="campo">
                  <span class="valor-campo">Você possui uma nova validação pendente.</span>
              </div>
              <div class="campo">
                  <span id="test-produto" class="label-campo">Produto:</span>
                  <span id="test-produto-valor" class="valor-campo text-overflow-ellipsis overflow-hidden white-space-nowrap">
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                  aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  
                  </span>
              </div>
              <div class="campo">
                  <span id="test-loja" class="label-campo">Loja:</span>
                  <span id="test-loja-valor" class="valor-campo">%s</span>
              </div>
          </div>
          <a id="test-link-ver-detalhes" class='ver-detalhes link-text' href="%s">Ver detalhes</a>
      `;

  listarLidas() {
    const headers = {
      headers: {
        ...this.autenticado,
      }
    };

    return this.httpClient.post<ResponseDTO<NotificacaoResponse[]>>(`${this.baseUrl}`, {
      ids: undefined
    }, headers).pipe(
      map((response: ResponseDTO<NotificacaoResponse[]>) => {
        return NotificacaoResponse.filtrarListaLidas(response.data);
      })
    );
  }

  listarNaoLidas() {
    const headers = {
      headers: {
        ...this.autenticado,
      }
    };

    return this.httpClient.post<ResponseDTO<NotificacaoResponse[]>>(`${this.baseUrl}`, {}, headers).pipe(
      map((response: ResponseDTO<NotificacaoResponse[]>) => {
        return NotificacaoResponse.filtrarListaNaoLidas(response.data);
      })
    );
  }

  marcarComoLida(notificacaoID: string) {
    const headers = {
      headers: {
        ...this.autenticado,
      }
    };

    return this.httpClient.get<ResponseDTO<NotificacaoResponse>>(`${this.baseUrl}/${notificacaoID}`, headers)
  }

  marcarTodasComoLidas(arrNotificacoesID: string[]) {
    const headers = {
      headers: {
        ...this.autenticado,
      }
    };
    const ids = arrNotificacoesID.join(',');
    return this.httpClient.post<ResponseDTO<NotificacaoResponse[]>>(
      `${this.baseUrl}?ids=${ids}`, 
      {
        ids: arrNotificacoesID,
      },
      headers
    ).pipe(
      map((response: ResponseDTO<NotificacaoResponse[]>) => {
        return NotificacaoResponse.filtrarListaLidas(response.data);
      })
    );
  }
}
