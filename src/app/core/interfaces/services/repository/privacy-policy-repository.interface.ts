import { Observable } from 'rxjs';
import { PoliticaPrivacidade } from '@app/model/politica-privacidade';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface PrivacyPolicyFilterDto extends IBaseFilterDto {}

export interface IPrivacyPolicyRepository extends IRepository<PoliticaPrivacidade, any, any, PrivacyPolicyFilterDto> {
  pegarPoliticaPrivacidade(): Observable<PoliticaPrivacidade>;
}

