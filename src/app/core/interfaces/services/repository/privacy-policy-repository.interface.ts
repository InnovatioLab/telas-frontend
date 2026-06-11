import { Observable } from 'rxjs';
import { PrivacyPolicy } from '@app/model/privacy-policy';
import { IRepository } from './repository.interface';
import { IBaseFilterDto } from '@app/model/interfaces/dto-interfaces';

export interface PrivacyPolicyFilterDto extends IBaseFilterDto {}

export interface IPrivacyPolicyRepository extends IRepository<PrivacyPolicy, any, any, PrivacyPolicyFilterDto> {
  pegarPrivacyPolicy(): Observable<PrivacyPolicy>;
}

