import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export class BaseHttpService<T> {
  public url = environment.urlApi;

  constructor(private http: HttpClient, public rota: string) {
    this.url += rota;
  }

  buscar(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  obterPorId(id: number): Observable<T> {
    return this.http.get<T>(this.url + id);
  }

  salvar(entidade: T): Observable<T> {
    return this.http.post<T>(this.url, entidade);
  }

  salvaArray(entidade: Array<T>): Observable<T> {
    return this.http.post<T>(this.url + 'importar', entidade);
  }

  atualizar(entidade: T, id?: number): Observable<T> {
    return this.http.put<T>(this.url + id, entidade);
  }

  excluir(id: string): Observable<any> {
    return this.http.delete(this.url + id);
  }

  criarParametros(filtro: any) {
    let httpParams = new HttpParams();
    for (const prop in filtro) {
      if (Object.prototype.hasOwnProperty.call(filtro, prop) && filtro[prop] != null && filtro[prop] != '' ) {
        if (filtro[prop] instanceof Number) {
          httpParams = httpParams.append(prop, filtro[prop].toString());
        } else {
          httpParams = httpParams.append(prop, filtro[prop]);
        }
      }
    }

    return httpParams;
  }
}
