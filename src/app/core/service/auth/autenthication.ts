import { computed, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationStorage } from './authentication-storage';
import { JwtHelperService } from '@auth0/angular-jwt';
import { firstValueFrom, BehaviorSubject } from 'rxjs';
import { Client, Role } from '@app/model/client';
import { ClientService } from '../api/client.service';

@Injectable({ providedIn: 'root' })
export class Authentication extends AuthenticationStorage {
  private readonly router = inject(Router);

  _clientSignal = signal<Client | null>(null);

  _helperJwt: JwtHelperService;

  client = this._clientSignal.asReadonly();

  nomeToken = AuthenticationStorage.storageName;

  get helperJwt() {
    const helper = this._helperJwt
      ? this._helperJwt
      : new JwtHelperService({
          tokenGetter: AuthenticationStorage.getToken()
        });

    this._helperJwt = helper;
    return this._helperJwt;
  }

  clientId: string;

  loggedIn = computed(() => !!this.client());
  private readonly loggedInSubject = new BehaviorSubject<boolean>(this.isTokenValido());
  private readonly authStateSubject = new BehaviorSubject<void>(null);
  authState$ = this.loggedInSubject.asObservable();

  get isLoggedIn$() {
    return this.loggedInSubject;
  }

  constructor(private readonly clientService: ClientService) {
    super();

    console.log('Authentication service inicializado');
    this.checkInitialToken();

    if (Authentication.getDataUser()) {
      const client = JSON.parse(Authentication.getDataUser());
      this._clientSignal.set(client);
    }

    this.loggedInSubject.next(this.isTokenValido());
  }

  private checkInitialToken(): void {
    console.log('Verificando token inicial');
    // Adicionar log para depurar verificação do token
    const token = localStorage.getItem('token');
    console.log('Token encontrado:', !!token);
  }

  public get token(): string {
    if (Authentication.getToken()) {
      return Authentication.getToken();
    }
    return null;
  }

  public isTokenValido(): boolean {
    const token = localStorage.getItem('token');
    console.log('Verificando validade do token:', !!token);

    return !!token;
  }

  public isAceitouTermo(): boolean {
    const client = this._clientSignal();
    return Boolean(client?.termAccepted);
  }

  public isAdministrador(): boolean {
    const client = this.client();
    return client?.role === Role.ADMIN;
  }

  async pegarDadosAutenticado(): Promise<Client> {
    this.clientId = this.helperJwt.decodeToken(this.token).id;
    const login$ = this.clientService.buscarClient<Client>(this.clientId);

    const client = await firstValueFrom(login$);
    if (!client.role) {
      console.error('Role do cliente não encontrada no retorno da API.');
    }
    this._clientSignal.update(data => ({ ...data, ...client }));
    AuthenticationStorage.setDataUser(JSON.stringify(this._clientSignal()));
    this.loggedInSubject.next(true); 
    this.authStateSubject.next(); 

    return client;
  }

  removerAutenticacao() {
    this.removerIndicadorDeAcesso();
    this._clientSignal.update(() => null);
    AuthenticationStorage.clearToken();
    this.loggedInSubject.next(false); 
    this.authStateSubject.next();
  }

  removerIndicadorDeAcesso() {
    localStorage.setItem('FEZ_ACESSO', 'false');
  }

  loginExpirado() {
    this._clientSignal.update(() => null);
    this.loggedInSubject.next(false);
    this.authStateSubject.next();
  }

  atualizarFavoritosStorage(lista: string[]) {
    this._clientSignal.update(data => ({ ...data, ofertasFavoritas: lista }));
    AuthenticationStorage.setDataUser(JSON.stringify(this._clientSignal()));
  }

  public getClient(): Client | null {
    const client = this._clientSignal();
    if (client) return client;
    const clientData = AuthenticationStorage.getDataUser();
    if (clientData) {
      try {
        const parsed = JSON.parse(clientData);
        this._clientSignal.set(parsed);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  }

  updateClientData(client: Client): void {
    this._clientSignal.set(client);
    AuthenticationStorage.setDataUser(JSON.stringify(client));
  }
}
