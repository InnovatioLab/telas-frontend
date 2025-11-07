import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, firstValueFrom } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { IAuthService } from '@app/core/interfaces/services/auth/auth-service.interface';
import { Client, Role } from '@app/model/client';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';
import { TokenStorageService } from './token-storage.service';
import { AuthStateService } from './auth-state.service';
import { ClientService } from '../api/client.service';
import { AuthenticationStorage } from './authentication-storage';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements IAuthService {
  private readonly baseUrl = `${environment.apiUrl}auth/`;
  private readonly http: HttpClient;
  private readonly httpBackend: HttpClient;
  private readonly tokenStorage: TokenStorageService;
  private readonly authState: AuthStateService;
  private readonly clientService: ClientService;
  
  private readonly userSubject = new BehaviorSubject<Client | null>(null);
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly authStateSubject = new BehaviorSubject<void>(null);
  
  private readonly _clientSignal = signal<Client | null>(null);
  private readonly _loggedClientSignal = signal<AuthenticatedClientResponseDto | null>(null);
  private _helperJwt: JwtHelperService | null = null;
  
  readonly client = this._clientSignal.asReadonly();
  readonly loggedIn = computed(() => !!this.client());
  readonly authState$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    http: HttpClient,
    tokenStorage: TokenStorageService,
    authState: AuthStateService,
    clientService: ClientService
  ) {
    this.http = http;
    this.httpBackend = new HttpClient(inject(HttpBackend));
    this.tokenStorage = tokenStorage;
    this.authState = authState;
    this.clientService = clientService;

    const storedUser = AuthenticationStorage.getDataUser();
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this._clientSignal.set(user);
        this.userSubject.next(user);
        this.authState.setUser(user);
        this.isAuthenticatedSubject.next(this.isTokenValid());
      } catch {
        this.clearToken();
      }
    }
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get user$(): Observable<Client | null> {
    return this.userSubject.asObservable();
  }

  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  get isLoggedIn$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  get token(): string | null {
    return this.tokenStorage.getToken();
  }

  get user(): Client | null {
    return this._clientSignal();
  }

  get loggedClient(): AuthenticatedClientResponseDto | null {
    return this._loggedClientSignal();
  }

  get helperJwt(): JwtHelperService {
    if (!this._helperJwt) {
      this._helperJwt = new JwtHelperService({
        tokenGetter: () => this.tokenStorage.getToken() || ''
      });
    }
    return this._helperJwt;
  }

  get nomeToken(): string {
    return AuthenticationStorage.storageName;
  }

  login(username: string, password: string): Observable<string>;
  login(payload: { username: string; password: string }): Observable<{ token: string; client: AuthenticatedClientResponseDto }>;
  login(usernameOrPayload: string | { username: string; password: string }, password?: string): Observable<string | { token: string; client: AuthenticatedClientResponseDto }> {
    this.isLoadingSubject.next(true);
    
    const payload = typeof usernameOrPayload === 'string' 
      ? { username: usernameOrPayload, password: password! }
      : usernameOrPayload;

    return this.http.post<{ data: string }>(`${this.baseUrl}login`, payload).pipe(
      map(response => {
        if (!response?.data) {
          throw new Error('Authentication token not received.');
        }
        return response.data;
      }),
      switchMap(token => {
        this.tokenStorage.setToken(token);
        
        if (typeof usernameOrPayload === 'object') {
          return this.clientService.getAuthenticatedClient().pipe(
            tap(client => {
              AuthenticationStorage.setDataUser(JSON.stringify(client));
              this._loggedClientSignal.set(client);
              this.updateClientData(client as any);
            }),
            map(client => ({ token, client }))
          );
        } else {
          return this.getAuthenticatedClient().pipe(
            tap(client => {
              this.userSubject.next(client as Client);
              this.isAuthenticatedSubject.next(true);
              this.updateUserData(client as Client);
            }),
            map(() => token)
          );
        }
      }),
      catchError(error => {
        this.isLoadingSubject.next(false);
        this.clearToken();
        this._loggedClientSignal.set(null);
        console.error('Login process failed:', error.message || error);
        const friendlyError = new Error('Invalid credentials. Please try again.');
        return throwError(() => friendlyError);
      })
    );
  }

  logout(): void {
    this.clearToken();
    this.userSubject.next(null);
    this._clientSignal.set(null);
    this._loggedClientSignal.set(null);
    this.isAuthenticatedSubject.next(false);
    this.isLoadingSubject.next(false);
    this.authState.clear();
    this.authStateSubject.next();
    AuthenticationStorage.removerIndicadorDeAcesso();
  }

  isTokenValid(): boolean {
    try {
      const token = this.tokenStorage.getToken();
      if (!token || token === 'null') return false;
      if (this.tokenStorage.isTokenValid && typeof this.tokenStorage.isTokenValid === 'function') {
        return this.tokenStorage.isTokenValid();
      }
      const tokenExpirado = this.helperJwt.isTokenExpired(token);
      return !tokenExpirado;
    } catch {
      return false;
    }
  }

  refreshToken(): Observable<string> {
    const refreshToken = AuthenticationStorage.getRefreshToken();
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

  atualizarToken(): Observable<{ data: { id_token: string } }> {
    return this.httpBackend.post<{ data: { id_token: string } }>(`${this.baseUrl}/refresh-token`, {
      refresh_token: AuthenticationStorage.getRefreshToken()
    }).pipe(
      map(response => {
        AuthenticationStorage.setToken(response.data.id_token);
        return response;
      })
    );
  }

  getCurrentUser(): Client | null {
    return this.userSubject.value;
  }

  getClient(): Client | null {
    const client = this._clientSignal();
    if (client) return client;
    const clientData = AuthenticationStorage.getDataUser();
    if (clientData) {
      try {
        const parsed = JSON.parse(clientData);
        this._clientSignal.set(parsed);
        this.userSubject.next(parsed);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  getAuthenticatedClient(): Observable<AuthenticatedClientResponseDto> {
    return this.clientService.getAuthenticatedClient();
  }

  async pegarDadosAutenticado(): Promise<Client> {
    const token = this.token;
    if (!token) {
      throw new Error('No token available');
    }
    
    const decoded = this.helperJwt.decodeToken(token);
    const clientId = decoded?.id;
    if (!clientId) {
      throw new Error('Invalid token: no id found');
    }

    const client = await firstValueFrom(this.clientService.buscarClient<Client>(clientId));
    if (!client.role) {
      console.error('Role do cliente não encontrada no retorno da API.');
    }
    
    this._clientSignal.update((data) => ({ ...data, ...client }));
    AuthenticationStorage.setDataUser(JSON.stringify(this._clientSignal()));
    this.userSubject.next(this._clientSignal());
    this.isAuthenticatedSubject.next(true);
    this.authState.setUser(this._clientSignal()!);
    this.authStateSubject.next();

    return client;
  }

  updateUserData(user: Client): void {
    this._clientSignal.set(user);
    this.userSubject.next(user);
    this.authState.setUser(user);
    AuthenticationStorage.setDataUser(JSON.stringify(user));
  }

  updateClientData(client: Client): void {
    this._clientSignal.set(client);
    this.userSubject.next(client);
    this.authState.setUser(client);
    AuthenticationStorage.setDataUser(JSON.stringify(client));
    
    try {
      if (this.clientService && typeof this.clientService.setClientAtual === 'function') {
        this.clientService.setClientAtual(client);
      }
    } catch (e) {
      console.warn('Falha ao sincronizar client atual com ClientService:', e);
    }
    
    try {
      this.isAuthenticatedSubject.next(true);
      this.authStateSubject.next();
    } catch (e) {
      console.warn('Falha ao emitir estado de login em updateClientData:', e);
    }
  }

  removerAutenticacao(): void {
    this.logout();
  }

  removerIndicadorDeAcesso(): void {
    AuthenticationStorage.removerIndicadorDeAcesso();
  }

  loginExpirado(): void {
    this._clientSignal.set(null);
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.authStateSubject.next();
  }

  atualizarFavoritosStorage(lista: string[]): void {
    this._clientSignal.update((data) => ({ ...data, ofertasFavoritas: lista } as any));
    const updatedClient = this._clientSignal();
    if (updatedClient) {
      AuthenticationStorage.setDataUser(JSON.stringify(updatedClient));
      this.userSubject.next(updatedClient);
    }
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}recovery-password/${email}`, {});
  }

  recuperarSenha(login: string): Observable<void> {
    return this.forgotPassword(login);
  }

  resetPassword(email: string, request: SenhaRequestDto): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}reset-password/${email}`, request);
  }

  redefinirSenha(login: string, request: SenhaRequestDto): Observable<void> {
    return this.resetPassword(login, request);
  }

  changePassword(request: SenhaUpdate): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}update-password`, request, {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    });
  }

  alterarSenha(request: SenhaUpdate): Observable<SenhaUpdate> {
    return this.http.patch<SenhaUpdate>(`${this.baseUrl}update-password`, request, {
      headers: {
        Authorization: `Bearer ${this.tokenStorage.getToken()}`
      }
    });
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === Role.ADMIN;
  }

  isAdministrador(): boolean {
    return this.isAdmin();
  }

  hasAcceptedTerms(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.termAccepted);
  }

  isAceitouTermo(): boolean {
    const client = this._clientSignal();
    return Boolean(client?.termAccepted);
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  getToken(): string | null {
    return this.tokenStorage.getToken();
  }

  setToken(token: string): void {
    this.tokenStorage.setToken(token);
  }

  clearToken(): void {
    this.tokenStorage.removeToken();
    AuthenticationStorage.clearToken();
    this.userSubject.next(null);
    this._clientSignal.set(null);
    this._loggedClientSignal.set(null);
    this.isAuthenticatedSubject.next(false);
    this.authState.clear();
  }
}