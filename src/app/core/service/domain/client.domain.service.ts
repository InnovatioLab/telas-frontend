import { Injectable, Inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';
import { IClientDomainService } from '@app/core/interfaces/services/domain/client-domain-service.interface';
import { IClientRepository } from '@app/core/interfaces/services/repository/client-repository.interface';
import { CLIENT_REPOSITORY_TOKEN } from '@app/core/tokens/injection-tokens';

@Injectable({ providedIn: 'root' })
export class ClientDomainService implements IClientDomainService {
  constructor(@Inject(CLIENT_REPOSITORY_TOKEN) private readonly repository: IClientRepository) {}

  createClient(clientData: ClientRequestDTO): Observable<Client> {
    if (!this.validateClientData(clientData)) {
      return throwError(() => new Error('Invalid client data'));
    }
    return this.repository.save(clientData);
  }

  updateClient(id: string, clientData: Partial<ClientRequestDTO>): Observable<Client> {
    return this.repository.update(id, clientData);
  }

  deleteClient(id: string): Observable<void> {
    return this.repository.delete(id);
  }

  validateClientData(clientData: ClientRequestDTO): boolean {
    const hasEmail = !!clientData?.contact?.email;
    const hasBusinessName = !!clientData?.businessName;
    return hasEmail && hasBusinessName;
  }

  applyBusinessRules(client: Client): Client {
    // no-op for now; placeholder for future domain rules
    return client;
  }
}


