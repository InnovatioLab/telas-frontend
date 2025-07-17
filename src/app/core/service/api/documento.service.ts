import { BaseHttpService } from './base-htttp.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Documento } from '@app/model/documento';
import { DocumentoResponseDTO, DocumentoDetalhesDTO, DocumentoDTOUtils } from '@app/model/dto/response/documentos.dto';
import { UploadResponse, ServiceResponse } from '@app/model/dto/response/upload.dto';
import { AtualizarDocumentoRequest } from '@app/model/dto/request/atualizar-documento.request.dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DocumentoService extends BaseHttpService<Documento> {

  constructor(protected httpClient: HttpClient) {
    super(httpClient, 'documento/');
  }

  obterTodos(pagina = 1, itensPorPagina = 10): Observable<any> {
    return this.httpClient.get<DocumentoResponseDTO[]>(`${environment.urlApi}files/list`)
      .pipe(
        map((response: DocumentoResponseDTO[]) => {
          const documentos = DocumentoDTOUtils.fromDTOList(response);
          return {
            items: documentos,
            total: documentos.length,
            pagina,
            itensPorPagina
          };
        })
      );
  }

  criar(formData: FormData): Observable<ServiceResponse<UploadResponse>> {

    return this.httpClient.post<UploadResponse>(
      `${environment.urlApi}files/upload`,
      formData
    ).pipe(
      map((response: UploadResponse) => this.verificarArquivosFalhados(response))
    );
  }

  private verificarArquivosFalhados(response: UploadResponse): ServiceResponse<UploadResponse> {
    if (response?.falharam?.length > 0) {
      const arquivosFalhados = response.falharam;
      const mensagensErro = arquivosFalhados.map(item => `${item.arquivo}: ${item.erro}`).join(', ');

      return {
        success: false,
        message: `Alguns arquivos não puderam ser enviados: ${mensagensErro}`,
        data: response
      };
    }

    return {
      success: true,
      data: response
    };
  }

  atualizarDocumento(id: string, formData: FormData): Observable<ServiceResponse> {

    const updateData = AtualizarDocumentoRequest.fromFormData(formData);

    return this.httpClient.patch<any>(
      `${environment.urlApi}files/update/${id}`,
      updateData,
    ).pipe(
      map(response => {
        return {
          success: true,
          data: response
        };
      })
    );
  }

  obterDetalhesDocumento(id: string): Observable<DocumentoDetalhesDTO> {

    return this.httpClient.get<DocumentoDetalhesDTO>(
      `${environment.urlApi}files/details/${id}`
    );
  }

  override excluir(id: string): Observable<ServiceResponse> {

    return this.httpClient.delete(
      `${environment.urlApi}files/delete-file/${id}`,
      { observe: 'response' }
    ).pipe(
      map(response => {
        if (response.status === 204 || response.status === 200) {
          return {
            success: true,
            message: 'Documento excluído.'
          };
        }
        return {
          success: false,
          message: 'Erro ao excluir documento. Tente novamente mais tarde'
        };
      })
    );
  }

  downloadAnexo(anexoID: string): Observable<Blob> {
    const headers = { responseType: 'blob' as 'json' };

    return this.httpClient.get<Blob>(
      `${environment.urlApi}files/download/${anexoID}`,
      headers
    );
  }
}
