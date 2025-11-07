jest.mock('src/environments/environment', () => ({
  environment: {
    production: false,
    apiUrl: 'http://localhost:8080/api/',
    zipCodeApiKey: 'mock-zip-code-api-key',
    googleMapsApiKey: 'mock-google-maps-api-key',
    stripePublicKey: 'mock-stripe-public-key',
    stripePrivateKey: 'mock-stripe-private-key',
  }
}));

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Authentication } from '../autenthication';
import { AuthenticationStorage } from '../authentication-storage';
import { ClientService } from '../../api/client.service';
import { Client, Role } from '@app/model/client';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../auth.service';

function createJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (obj: any) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64(header)}.${b64(payload)}.signature`;
}

describe('Authentication', () => {
  let service: Authentication;
  let clientServiceSpy: jest.Mocked<ClientService>;
  let localStorageMock: Storage;

  const mockClient: Client = {
    id: '1',
    businessName: 'Test Business',
    contact: { email: 'test@test.com' },
    role: Role.CLIENT,
    termAccepted: true
  } as Client;

  beforeEach(() => {
    localStorageMock = (() => {
      const store = new Map<string, string>();
      return {
        clear: () => store.clear(),
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => void store.delete(k),
        setItem: (k: string, v: string) => void store.set(k, v),
        get length() {
          return store.size;
        },
      } as Storage;
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    const clientServiceSpyObj = {
      buscarClient: jest.fn(),
      setClientAtual: jest.fn(),
      clientAtual$: new BehaviorSubject<Client | null>(null)
    };

    TestBed.configureTestingModule({
      providers: [
        Authentication,
        { provide: ClientService, useValue: clientServiceSpyObj },
        { provide: AuthService, useValue: null, optional: true }
      ]
    });

    service = TestBed.inject(Authentication);
    clientServiceSpy = TestBed.inject(ClientService) as jest.Mocked<ClientService>;
  });

  afterEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with user from localStorage', () => {
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));
      const auth = new Authentication(clientServiceSpy as any);
      expect(auth.client()).toEqual(mockClient);
    });

    it('should initialize loggedIn computed correctly', () => {
      expect(service.loggedIn()).toBe(false);
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));
      const auth = new Authentication(clientServiceSpy as any);
      expect(auth.loggedIn()).toBe(true);
    });
  });

  describe('Token management', () => {
    it('should get token from storage', () => {
      const token = 'test-token';
      AuthenticationStorage.setToken(token);
      expect(service.token).toBe(token);
    });

    it('should return null when token is not in storage', () => {
      AuthenticationStorage.clearToken();
      expect(service.token).toBe(null);
    });

    it('should validate token correctly when token is valid', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const token = createJwt({ id: '1', exp: future });
      AuthenticationStorage.setToken(token);
      expect(service.isTokenValido()).toBe(true);
    });

    it('should return false when token is expired', () => {
      const past = Math.floor(Date.now() / 1000) - 3600;
      const token = createJwt({ id: '1', exp: past });
      AuthenticationStorage.setToken(token);
      expect(service.isTokenValido()).toBe(false);
    });

    it('should return false when token is null', () => {
      AuthenticationStorage.clearToken();
      expect(service.isTokenValido()).toBe(false);
    });

    it('should return false when token is "null" string', () => {
      AuthenticationStorage.setToken('null');
      expect(service.isTokenValido()).toBe(false);
    });

    it('should return false when token is invalid', () => {
      AuthenticationStorage.setToken('invalid-token');
      expect(service.isTokenValido()).toBe(false);
    });
  });

  describe('User state management', () => {
    it('should get client from signal', () => {
      service['_clientSignal'].set(mockClient);
      expect(service.client()).toBe(mockClient);
    });

    it('should get client from localStorage when signal is empty', () => {
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));
      const client = service.getClient();
      expect(client).toEqual(mockClient);
      expect(service['_clientSignal']()).toEqual(mockClient);
    });

    it('should return null when no client data exists', () => {
      localStorage.removeItem('telas_token_user');
      expect(service.getClient()).toBeNull();
    });

    it('should update client data', () => {
      const updatedClient = { ...mockClient, businessName: 'Updated Business' };
      service.updateClientData(updatedClient);
      expect(service.client()).toEqual(updatedClient);
      expect(JSON.parse(localStorage.getItem('telas_token_user')!)).toEqual(updatedClient);
    });

    it('should sync with ClientService when updating client data', () => {
      service.updateClientData(mockClient);
      expect(clientServiceSpy.setClientAtual).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('Authentication state', () => {
    it('should update loggedIn computed when client is set', () => {
      expect(service.loggedIn()).toBe(false);
      service['_clientSignal'].set(mockClient);
      expect(service.loggedIn()).toBe(true);
    });

    it('should emit to isLoggedIn$ when token is valid', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const token = createJwt({ id: '1', exp: future });
      AuthenticationStorage.setToken(token);
      const auth = new Authentication(clientServiceSpy as any);
      auth.isLoggedIn$.subscribe(value => {
        expect(value).toBe(true);
      });
    });
  });

  describe('pegarDadosAutenticado', () => {
    it('should fetch and update client data', async () => {
      const token = createJwt({ id: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
      AuthenticationStorage.setToken(token);
      clientServiceSpy.buscarClient.mockReturnValue(of(mockClient));

      const client = await service.pegarDadosAutenticado();

      expect(client).toEqual(mockClient);
      expect(service.client()).toEqual(mockClient);
      expect(clientServiceSpy.buscarClient).toHaveBeenCalledWith('1');
      expect(localStorage.getItem('telas_token_user')).toBeTruthy();
    });

    it('should handle missing role in response', async () => {
      const token = createJwt({ id: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
      AuthenticationStorage.setToken(token);
      const clientWithoutRole = { ...mockClient, role: undefined as any };
      clientServiceSpy.buscarClient.mockReturnValue(of(clientWithoutRole as any));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.pegarDadosAutenticado();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Role do cliente não encontrada no retorno da API.'
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('removerAutenticacao', () => {
    it('should clear authentication state', () => {
      service['_clientSignal'].set(mockClient);
      AuthenticationStorage.setToken('test-token');
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));

      service.removerAutenticacao();

      expect(service.client()).toBeNull();
      expect(AuthenticationStorage.getToken()).toBeNull();
      expect(localStorage.getItem('telas_token_user')).toBeNull();
    });

    it('should set FEZ_ACESSO to false', () => {
      service.removerIndicadorDeAcesso();
      expect(localStorage.getItem('FEZ_ACESSO')).toBe('false');
    });
  });

  describe('loginExpirado', () => {
    it('should clear client signal and update loggedIn state', () => {
      service['_clientSignal'].set(mockClient);
      
      service.loginExpirado();

      expect(service.client()).toBeNull();
    });
  });

  describe('atualizarFavoritosStorage', () => {
    it('should update favorites list in client data', () => {
      service['_clientSignal'].set(mockClient);
      const favorites = ['fav1', 'fav2', 'fav3'];

      service.atualizarFavoritosStorage(favorites);

      const clientData = service.client() as any;
      expect(clientData?.ofertasFavoritas).toEqual(favorites);
      const storedData = JSON.parse(localStorage.getItem('telas_token_user')!);
      expect(storedData.ofertasFavoritas).toEqual(favorites);
    });
  });

  describe('Permission checks', () => {
    it('should check if user accepted terms', () => {
      service['_clientSignal'].set(mockClient);
      expect(service.isAceitouTermo()).toBe(true);

      const clientWithoutTerms = { ...mockClient, termAccepted: false };
      service['_clientSignal'].set(clientWithoutTerms);
      expect(service.isAceitouTermo()).toBe(false);
    });

    it('should check if user is admin', () => {
      const adminClient = { ...mockClient, role: Role.ADMIN };
      service['_clientSignal'].set(adminClient);
      expect(service.isAdministrador()).toBe(true);

      service['_clientSignal'].set(mockClient);
      expect(service.isAdministrador()).toBe(false);
    });
  });

  describe('helperJwt', () => {
    it('should create JwtHelperService when accessed', () => {
      expect(service.helperJwt).toBeInstanceOf(JwtHelperService);
    });

    it('should reuse existing JwtHelperService instance', () => {
      const helper1 = service.helperJwt;
      const helper2 = service.helperJwt;
      expect(helper1).toBe(helper2);
    });
  });
});
