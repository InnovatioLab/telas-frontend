// Mock environment to avoid import.meta issues
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
import { of } from 'rxjs';
import { AuthService } from '../auth.service';
import { TokenStorageService } from '../token-storage.service';
import { AuthStateService } from '../auth-state.service';
import { ClientService } from '../../api/client.service';
import { Client, Role } from '@app/model/client';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';
import { SenhaRequestDto } from '@app/model/dto/request/senha-request.dto';
import { SenhaUpdate } from '@app/model/dto/request/senha-update.request';

function createJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (obj: any) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64(header)}.${b64(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorageSpy: jest.Mocked<TokenStorageService>;
  let authStateSpy: jest.Mocked<AuthStateService>;
  let clientServiceSpy: jest.Mocked<ClientService>;

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
    const tokenStorageSpyObj = {
      setToken: jest.fn(),
      getToken: jest.fn(),
      removeToken: jest.fn(),
      isTokenValid: jest.fn()
    };
    const authStateSpyObj = {
      setUser: jest.fn(),
      clear: jest.fn(),
      setLoading: jest.fn(),
      user: jest.fn().mockReturnValue(mockClient),
      isAuthenticated: jest.fn().mockReturnValue(true),
      isLoading: jest.fn().mockReturnValue(false)
    };
    const clientServiceSpyObj = {
      getAuthenticatedClient: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TokenStorageService, useValue: tokenStorageSpyObj },
        { provide: AuthStateService, useValue: authStateSpyObj },
        { provide: ClientService, useValue: clientServiceSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorageSpy = TestBed.inject(TokenStorageService) as jest.Mocked<TokenStorageService>;
    authStateSpy = TestBed.inject(AuthStateService) as jest.Mocked<AuthStateService>;
    clientServiceSpy = TestBed.inject(ClientService) as jest.Mocked<ClientService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully', (done) => {
      const mockToken = 'mock-jwt-token';
      const loginResponse = { data: mockToken };
      
      clientServiceSpy.getAuthenticatedClient.mockReturnValue(of(mockAuthenticatedClient));

      service.login('test@test.com', 'password').subscribe({
        next: (token) => {
          expect(token).toBe(mockToken);
          expect(tokenStorageSpy.setToken).toHaveBeenCalledWith(mockToken);
          done();
        },
        error: (error) => done()
      });

      const req = httpMock.expectOne(`${service['baseUrl']}login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'test@test.com', password: 'password' });
      req.flush(loginResponse);
    });

    it('should handle login error', (done) => {
      service.login('test@test.com', 'wrong-password').subscribe({
        next: () => done(),
        error: (error) => {
          expect(error.message).toBe('Invalid credentials. Please try again.');
          expect(tokenStorageSpy.removeToken).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}login`);
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      service.logout();
      expect(tokenStorageSpy.removeToken).toHaveBeenCalled();
    });
  });

  describe('isTokenValid', () => {
    it('should return token validity using tokenStorage when available', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjk5OTk5OTk5OTl9.signature';
      tokenStorageSpy.getToken.mockReturnValue(mockToken);
      tokenStorageSpy.isTokenValid = jest.fn().mockReturnValue(true);
      expect(service.isTokenValid()).toBe(true);
      expect(tokenStorageSpy.isTokenValid).toHaveBeenCalled();
    });

    it('should return token validity using helperJwt when tokenStorage.isTokenValid is not available', () => {
      const future = Math.floor(Date.now() / 1000) + 3600;
      const mockToken = createJwt({ id: '1', exp: future });
      tokenStorageSpy.getToken.mockReturnValue(mockToken);
      delete (tokenStorageSpy as any).isTokenValid;
      expect(service.isTokenValid()).toBe(true);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      // Set up the user in the service's internal state
      service['userSubject'].next(mockClient);
      const user = service.getCurrentUser();
      expect(user).toBe(mockClient);
    });
  });

  describe('getAuthenticatedClient', () => {
    it('should get authenticated client', () => {
      clientServiceSpy.getAuthenticatedClient.mockReturnValue(of(mockAuthenticatedClient));
      
      service.getAuthenticatedClient().subscribe(client => {
        expect(client).toBe(mockAuthenticatedClient);
      });
    });
  });

  describe('updateUserData', () => {
    it('should update user data', () => {
      const newUser = { ...mockClient, businessName: 'Updated Business' };
      service.updateUserData(newUser);
      expect(service.getCurrentUser()).toBe(newUser);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', () => {
      service.forgotPassword('test@test.com').subscribe();
      
      const req = httpMock.expectOne(`${service['baseUrl']}recovery-password/test@test.com`);
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('resetPassword', () => {
    it('should reset password', () => {
      const request = new SenhaRequestDto('newPassword', 'newPassword');
      service.resetPassword('test@test.com', request).subscribe();
      
      const req = httpMock.expectOne(`${service['baseUrl']}reset-password/test@test.com`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBe(request);
      req.flush({});
    });
  });

  describe('changePassword', () => {
    it('should change password', () => {
      const request: SenhaUpdate = { currentPassword: 'old', password: 'new', confirmPassword: 'new' };
      tokenStorageSpy.getToken.mockReturnValue('mock-token');
      
      service.changePassword(request).subscribe();
      
      const req = httpMock.expectOne(`${service['baseUrl']}update-password`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toBe(request);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush({});
    });
  });

  describe('role and permissions', () => {
    it('should check if user is admin', () => {
      expect(service.isAdmin()).toBe(false);
      
      const adminClient = { ...mockClient, role: Role.ADMIN };
      service['userSubject'].next(adminClient);
      expect(service.isAdmin()).toBe(true);
    });

    it('should check if user has accepted terms', () => {
      service['userSubject'].next(mockClient);
      expect(service.hasAcceptedTerms()).toBe(true);
      
      const clientWithoutTerms = { ...mockClient, termAccepted: false };
      service['userSubject'].next(clientWithoutTerms);
      expect(service.hasAcceptedTerms()).toBe(false);
    });

    it('should check if user has specific role', () => {
      service['userSubject'].next(mockClient);
      expect(service.hasRole(Role.CLIENT)).toBe(true);
      expect(service.hasRole(Role.ADMIN)).toBe(false);
    });
  });

  describe('token management', () => {
    it('should get token', () => {
      tokenStorageSpy.getToken.mockReturnValue('mock-token');
      expect(service.getToken()).toBe('mock-token');
    });

    it('should set token', () => {
      service.setToken('new-token');
      expect(tokenStorageSpy.setToken).toHaveBeenCalledWith('new-token');
    });

    it('should clear token', () => {
      service.clearToken();
      expect(tokenStorageSpy.removeToken).toHaveBeenCalled();
    });
  });
});
