import { computed, Injectable, signal, inject, Optional } from "@angular/core";
import { Client, Role } from "@app/model/client";
import { JwtHelperService } from "@auth0/angular-jwt";
import { BehaviorSubject, firstValueFrom } from "rxjs";
import { ClientService } from "../api/client.service";
import { AuthenticationStorage } from "./authentication-storage";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class Authentication extends AuthenticationStorage {
  private authService?: AuthService;
  
  _clientSignal = signal<Client | null>(null);

  _helperJwt: JwtHelperService;

  client = this._clientSignal.asReadonly();

  nomeToken = AuthenticationStorage.storageName;

  get helperJwt() {
    if (this.authService) {
      return this.authService.helperJwt;
    }
    const helper = this._helperJwt
      ? this._helperJwt
      : new JwtHelperService({
          tokenGetter: AuthenticationStorage.getToken(),
        });

    this._helperJwt = helper;
    return this._helperJwt;
  }

  clientId: string;

  loggedIn = computed(() => !!this.client());
  private readonly loggedInSubject = new BehaviorSubject<boolean>(
    this.isTokenValido()
  );
  private readonly authStateSubject = new BehaviorSubject<void>(null);
  authState$ = this.loggedInSubject.asObservable();

  get isLoggedIn$() {
    return this.loggedInSubject;
  }

  private clientService?: ClientService;

  constructor(@Optional() clientService?: ClientService) {
    super();
    this.clientService = clientService;
    
    try {
      this.authService = inject(AuthService, { optional: true });
    } catch {
      this.authService = undefined;
    }

    if (Authentication.getDataUser()) {
      const client = JSON.parse(Authentication.getDataUser());
      this._clientSignal.set(client);
      if (this.authService) {
        this.authService.updateUserData(client);
      }
    }

    this.loggedInSubject.next(this.isTokenValido());
  }

  public get token(): string | null {
    if (this.authService) {
      return this.authService.token;
    }
    if (Authentication.getToken()) {
      return Authentication.getToken();
    }
    return null;
  }

  public isTokenValido(): boolean {
    if (this.authService) {
      return this.authService.isTokenValid();
    }
    try {
      const token: string = AuthenticationStorage.getToken();
      const tokenExpirado = this.helperJwt.isTokenExpired(token);
      if (!token || token == "null" || tokenExpirado) return false;
      return true;
    } catch {
      return false;
    }
  }

  public isAceitouTermo(): boolean {
    if (this.authService) {
      return this.authService.isAceitouTermo();
    }
    const client = this._clientSignal();
    return Boolean(client?.termAccepted);
  }

  public isAdministrador(): boolean {
    if (this.authService) {
      return this.authService.isAdministrador();
    }
    const client = this.client();
    return client?.role === Role.ADMIN;
  }

  async pegarDadosAutenticado(): Promise<Client> {
    if (this.authService) {
      return this.authService.pegarDadosAutenticado();
    }
    if (!this.clientService) {
      throw new Error('ClientService not available');
    }
    this.clientId = this.helperJwt.decodeToken(this.token!).id;
    const login$ = this.clientService.buscarClient<Client>(this.clientId);

    const client = await firstValueFrom(login$) as Client;
    const currentData = this._clientSignal() || {};
    const mergedClient = Object.assign({}, currentData, client);
    this._clientSignal.set(mergedClient as Client);
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
    
    if (this.authService) {
      this.authService.removerAutenticacao();
    }
  }

  removerIndicadorDeAcesso() {
    localStorage.setItem("FEZ_ACESSO", "false");
  }

  loginExpirado() {
    if (this.authService) {
      this.authService.loginExpirado();
      return;
    }
    this._clientSignal.update(() => null);
    this.loggedInSubject.next(false);
    this.authStateSubject.next();
  }

  atualizarFavoritosStorage(lista: string[]) {
    this._clientSignal.update((data) => ({ ...data, ofertasFavoritas: lista } as any));
    AuthenticationStorage.setDataUser(JSON.stringify(this._clientSignal()));
    
    if (this.authService) {
      this.authService.atualizarFavoritosStorage(lista);
    }
  }

  public getClient(): Client | null {
    if (this.authService) {
      return this.authService.getClient();
    }
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
    
    if (this.authService) {
      this.authService.updateClientData(client);
    }
    
    const clientService = this['clientService'] as ClientService | undefined;
    if (
      clientService &&
      typeof (clientService as any).setClientAtual === "function"
    ) {
      try {
        (clientService as any).setClientAtual(client);
      } catch (e) {
      }
    }
    
    try {
      this.loggedInSubject.next(true);
      this.authStateSubject.next();
    } catch (e) {
    }
  }
}