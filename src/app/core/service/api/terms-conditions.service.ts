import { Inject, Injectable } from '@angular/core';
import { TermsConditions } from '@app/model/terms-conditions';
import { Observable } from 'rxjs';
import { ITermsConditionsRepository } from '@app/core/interfaces/services/repository/terms-conditions-repository.interface';
import { TERMS_CONDITIONS_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';

@Injectable({ providedIn: 'root' })
export class TermsConditionsService {
  constructor(
    @Inject(TERMS_CONDITIONS_REPOSITORY_TOKEN) private readonly repository: ITermsConditionsRepository
  ) {}

  pegarTermsConditions(): Observable<TermsConditions> {
    return this.repository.pegarTermsConditions();
  }
}
