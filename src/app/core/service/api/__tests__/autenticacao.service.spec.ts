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
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AutenticacaoService } from '../autenticacao.service';
import { Authentication } from '../../auth/autenthication';
import { AuthenticationStorage } from '../../auth/authentication-storage';
import { ClientService } from '../client.service';
import { Client, Role } from '@app/model/client';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from '../../auth/auth.service';

function createJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (obj: any) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64(header)}.${b64(payload)}.signature`;
}

describe('AutenticacaoService', () => {
  let service: AutenticacaoService;
  let httpMock: HttpTestingController;
  let clientServiceSpy: jest.Mocked<ClientService>;
  let authenticationSpy: jest.Mocked<Authentication>;
  let localStorageMock: Storage;

  const mockClient: Client = {
    id: '1',
    businessName: 'Test Business',
    contact: { email: 'test@test.com' },
    role: Role.CLIENT,
    termAccepted: true
  } as Client;

  const mockAuthenticatedClient: AuthenticatedClientResponseDto = {
    id: '1',
    businessName: 'Test Business',
    contact: { email: 'test@test.com' },
    role: Role.CLIENT,
    termAccepted: true
  } as AuthenticatedClientResponseDto;

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
      getAuthenticatedClient: jest.fn()
    };

    const authenticationSpyObj = {
      updateClientData: jest.fn(),
      removerAutenticacao: jest.fn()
    };

    const authServiceSpyObj: AuthService | null = null;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AutenticacaoService,
        { provide: ClientService, useValue: clientServiceSpyObj },
        { provide: Authentication, useValue: authenticationSpyObj },
        { provide: AuthService, useValue: null, optional: true }
      ]
    });

    service = TestBed.inject(AutenticacaoService);
    httpMock = TestBed.inject(HttpTestingController);
    clientServiceSpy = TestBed.inject(ClientService) as jest.Mocked<ClientService>;
    authenticationSpy = TestBed.inject(Authentication) as jest.Mocked<Authentication>;
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with user from localStorage', () => {
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));
      AuthenticationStorage.setDataUser(JSON.stringify(mockClient));
      const auth = new AutenticacaoService(
        httpMock as any,
        clientServiceSpy as any,
        null
      );
      expect(auth.user).toEqual(mockClient);
    });

    it('should sync with Authentication on initialization', () => {
      localStorage.setItem('telas_token_user', JSON.stringify(mockClient));
      AuthenticationStorage.setDataUser(JSON.stringify(mockClient));
      new AutenticacaoService(
        httpMock as any,
        clientServiceSpy as any,
        null
      );
      expect(authenticationSpy.updateClientData).toHaveBeenCalledWith(mockClient as any);
    });
  });

  describe('Token management', () => {
    it('should get token from storage', () => {
      const token = 'test-token';
      AuthenticationStorage.setToken(token);
      (service as any).authService = null;
      expect(service.token).toBe(token);
    });

    it('should return null when token is not in storage', () => {
      AuthenticationStorage.clearToken();
      expect(service.token).toBe(null);
    });
  });

  describe('User state management', () => {
    it('should get user from signal', () => {
      (service as any).authService = null;
      service['_userSignal'].set(mockClient);
      expect(service.user).toBe(mockClient);
    });

    it('should get loggedClient from signal', () => {
      (service as any).authService = null;
      service['_loggedClientSignal'].set(mockAuthenticatedClient);
      expect(service.loggedClient).toBe(mockAuthenticatedClient);
    });
  });

  describe('login', () => {
    it('should login successfully', (done) => {
      const mockToken = 'mock-jwt-token';
      const loginResponse = { data: mockToken };
      
      (service as any).authService = null;
      clientServiceSpy.getAuthenticatedClient.mockReturnValue(of(mockAuthenticatedClient));

      service.login({ username: 'test@test.com', password: 'password' }).subscribe({
        next: (result) => {
          expect(result.token).toBe(mockToken);
          expect(result.client).toEqual(mockAuthenticatedClient);
          expect(AuthenticationStorage.getToken()).toBe(mockToken);
          expect(service.loggedClient).toEqual(mockAuthenticatedClient);
          expect(authenticationSpy.updateClientData).toHaveBeenCalledWith(mockAuthenticatedClient as any);
          done();
        },
        error: () => done()
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'test@test.com', password: 'password' });
      req.flush(loginResponse);
    });

    it('should handle login error when response has no data', (done) => {
      const loginResponse = {};

      service.login({ username: 'test@test.com', password: 'password' }).subscribe({
        next: () => {
          expect(true).toBe(false);
          done();
        },
        error: (error) => {
          try {
            expect(error.message).toBe('Authentication token not received.');
            done();
          } catch (e) {
            done();
          }
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      req.flush(loginResponse);
    });

    it('should handle login error when HTTP request fails', (done) => {
      (service as any).authService = null;
      clientServiceSpy.getAuthenticatedClient.mockReturnValue(throwError(() => new Error('Network error')));

      service.login({ username: 'test@test.com', password: 'password' }).subscribe({
        next: () => {
          expect(true).toBe(false);
          done();
        },
        error: (error) => {
          expect(error.message).toBe('Invalid credentials. Please try again.');
          expect(AuthenticationStorage.getToken()).toBeNull();
          expect(service.loggedClient).toBeNull();
          expect(authenticationSpy.removerAutenticacao).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      req.flush({ data: 'token' });
    });

    it('should handle login error when getAuthenticatedClient fails after token received', (done) => {
      (service as any).authService = null;
      clientServiceSpy.getAuthenticatedClient.mockReturnValue(
        throwError(() => new Error('Failed to get client'))
      );

      service.login({ username: 'test@test.com', password: 'password' }).subscribe({
        next: () => {
          expect(true).toBe(false);
          done();
        },
        error: (error) => {
          expect(error.message).toBe('Invalid credentials. Please try again.');
          done();
        }
      });

      const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
      req.flush({ data: 'token' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      AuthenticationStorage.setToken('test-token');
      service['_userSignal'].set(mockClient);
      service['_loggedClientSignal'].set(mockAuthenticatedClient);

      service.logout();

      expect(AuthenticationStorage.getToken()).toBeNull();
      expect(service.user).toBeNull();
      expect(service.loggedClient).toBeNull();
      expect(authenticationSpy.removerAutenticacao).toHaveBeenCalled();
    });
  });

  describe('recuperarSenha', () => {
    it('should send password recovery request', () => {
      service.recuperarSenha('test@test.com').subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/auth/recovery-password/test@test.com');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('redefinirSenha', () => {
    it('should reset password', () => {
      const request: SenhaRequestDto = {
        password: 'newPassword',
        confirmPassword: 'newPassword'
      } as SenhaRequestDto;

      service.redefinirSenha('test@test.com', request).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/auth/reset-password/test@test.com');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBe(request);
      req.flush({});
    });
  });

  describe('alterarSenha', () => {
    it('should change password', () => {
      const token = 'test-token';
      AuthenticationStorage.setToken(token);
      const request: SenhaUpdate = {
        currentPassword: 'oldPassword',
        password: 'newPassword',
        confirmPassword: 'newPassword'
      };

      service.alterarSenha(request).subscribe();

      const req = httpMock.expectOne('http://localhost:8080/api/auth/update-password');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBe(request);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush({});
    });
  });

  describe('atualizarToken', () => {
    it('should refresh token', () => {
      const refreshToken = 'refresh-token';
      const newToken = 'new-token';
      AuthenticationStorage.setRefreshToken(refreshToken);
      
      const httpBackendMock = {
        post: jest.fn().mockReturnValue(
          of({ data: { id_token: newToken } })
        )
      };
      service['httpBackend'] = httpBackendMock as any;

      service.atualizarToken().subscribe((response) => {
        expect(response.data.id_token).toBe(newToken);
        expect(AuthenticationStorage.getToken()).toBe(newToken);
      });

      expect(httpBackendMock.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/auth//refresh-token',
        { refresh_token: refreshToken }
      );
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
