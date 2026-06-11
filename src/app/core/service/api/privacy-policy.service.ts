import { Inject, Injectable } from "@angular/core";
import { PrivacyPolicy } from "@app/model/privacy-policy";
import { Observable } from "rxjs";
import { IPrivacyPolicyRepository } from "@app/core/interfaces/services/repository/privacy-policy-repository.interface";
import { PRIVACY_POLICY_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

@Injectable({ providedIn: "root" })
export class PrivacyPolicyService {
  constructor(
    @Inject(PRIVACY_POLICY_REPOSITORY_TOKEN) private readonly repository: IPrivacyPolicyRepository
  ) {}

  pegarPrivacyPolicy(): Observable<PrivacyPolicy> {
    return this.repository.pegarPrivacyPolicy();
  }
}
