import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of, from, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { IAuthService } from '@app/core/interfaces/services/auth/auth-service.interface';
import { Client, Role } from '@app/model/client';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';
import { TokenStorageService } from './token-storage.service';
import { AuthStateService } from './auth-state.service';
import { ClientService } from '../api/client.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {
  private readonly baseUrl = `${environment.apiUrl}auth/`;
  private readonly userSubject = new BehaviorSubject<Client | null>(null);
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private authState: AuthStateService,
    private clientService: ClientService
  ) {
    // Initialize from stored data
    const storedUser = localStorage.getItem('telas_token_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch {
        this.clearToken();
      }
    }
  }

  // Authentication state
  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get user$(): Observable<Client | null> {
    return this.userSubject.asObservable();
  }

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  // Authentication methods
  login(username: string, password: string): Observable<string> {
    this.isLoadingSubject.next(true);
    
    return this.http.post<{ data: string }>(`${this.baseUrl}login`, { username, password }).pipe(
      map(response => {
        if (!response?.data) {
          throw new Error('Authentication token not received.');
        }
        return response.data;
      }),
      tap(token => {
        this.tokenStorage.setToken(token);
        this.isLoadingSubject.next(false);
      }),
      switchMap(token => 
        this.getAuthenticatedClient().pipe(
          tap(client => {
            this.userSubject.next(client as Client);
            this.isAuthenticatedSubject.next(true);
            localStorage.setItem('telas_token_user', JSON.stringify(client));
          }),
          map(() => token)
        )
      ),
      catchError(error => {
        this.isLoadingSubject.next(false);
        this.clearToken();
        console.error('Login process failed:', error.message || error);
        return throwError(() => new Error('Invalid credentials. Please try again.'));
      })
    );
  }

  logout(): void {
    this.clearToken();
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);
    localStorage.removeItem('telas_token_user');
  }

  isTokenValid(): boolean {
    return this.tokenStorage.isTokenValid();
  }

  refreshToken(): Observable<string> {
    const refreshToken = localStorage.getItem('telas_refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ data: { id_token: string } }>(`${this.baseUrl}refresh-token`, {
      refresh_token: refreshToken
    }).pipe(
      map(response => {
        const newToken = response.data.id_token;
        this.tokenStorage.setToken(newToken);
        return newToken;
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // User management
  getCurrentUser(): Client | null {
    return this.userSubject.value;
  }

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.clientService.getAuthenticatedClient();
  }

  updateUserData(user: Client): void {
    this.userSubject.next(user);
    localStorage.setItem('telas_token_user', JSON.stringify(user));
  }

  // Password management
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}recovery-password/${email}`, {});
  }

  resetPassword(email: string, request: SenhaRequestDto): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}reset-password/${email}`, request);
  }

  changePassword(request: SenhaUpdate): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}update-password`, request, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  // Role and permissions
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === Role.ADMIN;
  }

  hasAcceptedTerms(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.termAccepted);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Token management
  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  setToken(token: string): void {
    this.tokenStorage.setToken(token);
  }

  clearToken(): void {
    this.tokenStorage.removeToken();
  }
}
