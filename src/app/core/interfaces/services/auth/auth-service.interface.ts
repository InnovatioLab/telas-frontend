import { Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';

export interface IAuthService {
  // Authentication state
  readonly isAuthenticated$: Observable<boolean>;
  readonly user$: Observable<Client | null>;
  readonly isLoading$: Observable<boolean>;

  // Authentication methods
  login(username: string, password: string): Observable<string>;
  logout(): void;
  isTokenValid(): boolean;
  refreshToken(): Observable<string>;

  // User management
  getCurrentUser(): Client | null;
  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto>;
  updateUserData(user: Client): void;

  // Password management
  forgotPassword(email: string): Observable<void>;
  resetPassword(email: string, request: SenhaRequestDto): Observable<void>;
  changePassword(request: SenhaUpdate): Observable<void>;

  // Role and permissions
  isAdmin(): boolean;
  hasAcceptedTerms(): boolean;
  hasRole(role: string): boolean;

  // Token management
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}









