import { Observable } from 'rxjs';
import { TermsConditions } from '@app/model/terms-conditions';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface TermsConditionsFilterDto extends IBaseFilterDto {}

export interface ITermsConditionsRepository extends IRepository<TermsConditions, any, any, TermsConditionsFilterDto> {
  pegarTermsConditions(): Observable<TermsConditions>;
}

