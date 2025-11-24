import { Observable, BehaviorSubject } from 'rxjs';
import { Client } from '@app/model/client';
import { ClientRequestDTO } from '@app/model/dto/request/client-request.dto';

export interface IClientDomainService {
  createClient(clientData: ClientRequestDTO): Observable<Client>;

  updateClient(id: string, clientData: Partial<ClientRequestDTO>): Observable<Client>;

  deleteClient(id: string): Observable<void>;

  validateClientData(clientData: ClientRequestDTO): boolean;

  applyBusinessRules(client: Client): Client;
}

export interface IAuthService {

  login(credentials: LoginCredentials): Observable<AuthResponse>;

  logout(): Observable<void>;

  isAuthenticated(): boolean;

  getCurrentToken(): string | null;

  isTokenValid(token: string): boolean;
}

export interface IStateService<T> {

  getState(): Observable<T>;

  updateState(newState: T): void;

  getCurrentState(): T;

  clearState(): void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Client;
  expiresIn: number;
}














