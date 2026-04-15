import { Observable } from 'rxjs';
import { TermoCondicao } from '@app/model/termo-condicao';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface TermsConditionsFilterDto extends IBaseFilterDto {}

export interface ITermsConditionsRepository extends IRepository<TermoCondicao, any, any, TermsConditionsFilterDto> {
  pegarTermoCondicao(): Observable<TermoCondicao>;
}

