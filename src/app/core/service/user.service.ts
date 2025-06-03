import { HttpClient, HttpBackend } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '@app/model/dto/user';
import { Observable, Subject, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  storageName = 'raizes_ce_token';
  token = localStorage.getItem(this.storageName);
  httpBackend = new HttpClient(inject(HttpBackend));
  private autenticado = { Authorization: `Bearer ${this.token}` };

  cancelarEdicao$: Subject<boolean> = new Subject<boolean>();

  headers = {
    headers: {
      Authorization: `Bearer ${this.token}`
    }
  };

  private readonly url = environment.urlApi;

  constructor(private readonly httpClient: HttpClient) {}

  save(perfil: User, ignorarLoading = false) {
    const deveIgnorarLoading = ignorarLoading ? { 'Ignorar-Loading-Interceptor': 'true' } : {};

    return this.httpClient.post(`${this.url}`,
      perfil,
      { headers: {
        ...deveIgnorarLoading,
    }});
  }

  editar(id: string, perfil: User) {
    return this.httpClient.put<User>(`${this.url}/${id}`, perfil);
  }

  buscarUsuario<User>(idOuUID: string): Observable<User> {
    return this.httpClient.get<User>(`${this.url}/busca-usuario/${idOuUID}`).pipe(
      map(data => {
        return data;
      })
    );
  }
}
