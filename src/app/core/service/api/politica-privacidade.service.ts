import { Inject, Injectable } from "@angular/core";
import { PoliticaPrivacidade } from "@app/model/politica-privacidade";
import { Observable } from "rxjs";
import { IPrivacyPolicyRepository } from "@app/core/interfaces/services/repository/privacy-policy-repository.interface";
import { PRIVACY_POLICY_REPOSITORY_TOKEN } from "@app/core/tokens/injection-tokens";

@Injectable({ providedIn: "root" })
export class PoliticaPrivacidadeService {
  constructor(
    @Inject(PRIVACY_POLICY_REPOSITORY_TOKEN) private readonly repository: IPrivacyPolicyRepository
  ) {}

  pegarPoliticaPrivacidade(): Observable<PoliticaPrivacidade> {
    return this.repository.pegarPoliticaPrivacidade();
  }
}
