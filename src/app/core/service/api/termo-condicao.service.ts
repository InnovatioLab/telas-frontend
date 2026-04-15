import { Inject, Injectable } from '@angular/core';
import { TermoCondicao } from '@app/model/termo-condicao';
import { Observable } from 'rxjs';
import { ITermsConditionsRepository } from '@app/core/interfaces/services/repository/terms-conditions-repository.interface';
import { TERMS_CONDITIONS_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';

@Injectable({ providedIn: 'root' })
export class TermoCondicaoService {
  constructor(
    @Inject(TERMS_CONDITIONS_REPOSITORY_TOKEN) private readonly repository: ITermsConditionsRepository
  ) {}

  pegarTermoCondicao(): Observable<TermoCondicao> {
    return this.repository.pegarTermoCondicao();
  }
}
