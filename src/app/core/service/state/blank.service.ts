import BlankDTO from '@app/model/dto/blank.dto';
import { BaseHttpService } from './base-htttp.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BlankService extends BaseHttpService<BlankDTO> {
  constructor(private httpClient: HttpClient) {
    super(httpClient, 'blank/');
  }

  public customFunction(filtro: BlankDTO): Observable<BlankDTO[]> {
    return this.httpClient.get<BlankDTO[]>(this.url);
  }
}
