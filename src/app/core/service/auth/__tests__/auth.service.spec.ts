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

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenStorageSpy: jasmine.SpyObj<TokenStorageService>;
  let authStateSpy: jasmine.SpyObj<AuthStateService>;
  let clientServiceSpy: jasmine.SpyObj<ClientService>;

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
    const tokenStorageSpyObj = jasmine.createSpyObj('TokenStorageService', [
      'setToken', 'getToken', 'removeToken', 'isTokenValid'
    ]);
    const authStateSpyObj = jasmine.createSpyObj('AuthStateService', [
      'setUser', 'clear', 'setLoading'
    ], {
      user: jasmine.createSpy().and.returnValue(mockClient),
      isAuthenticated: jasmine.createSpy().and.returnValue(true),
      isLoading: jasmine.createSpy().and.returnValue(false)
    });
    const clientServiceSpyObj = jasmine.createSpyObj('ClientService', [
      'getAuthenticatedClient'
    ]);

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
    tokenStorageSpy = TestBed.inject(TokenStorageService) as jasmine.SpyObj<TokenStorageService>;
    authStateSpy = TestBed.inject(AuthStateService) as jasmine.SpyObj<AuthStateService>;
    clientServiceSpy = TestBed.inject(ClientService) as jasmine.SpyObj<ClientService>;
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
      
      clientServiceSpy.getAuthenticatedClient.and.returnValue(of(mockAuthenticatedClient));

      service.login('test@test.com', 'password').subscribe({
        next: (token) => {
          expect(token).toBe(mockToken);
          expect(tokenStorageSpy.setToken).toHaveBeenCalledWith(mockToken);
          expect(authStateSpy.setLoading).toHaveBeenCalledWith(true);
          expect(authStateSpy.setLoading).toHaveBeenCalledWith(false);
          expect(authStateSpy.setUser).toHaveBeenCalledWith(mockAuthenticatedClient as Client);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(`${service['baseUrl']}login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'test@test.com', password: 'password' });
      req.flush(loginResponse);
    });

    it('should handle login error', (done) => {
      service.login('test@test.com', 'wrong-password').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Invalid credentials. Please try again.');
          expect(authStateSpy.setLoading).toHaveBeenCalledWith(false);
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
      expect(authStateSpy.clear).toHaveBeenCalled();
    });
  });

  describe('isTokenValid', () => {
    it('should return token validity', () => {
      tokenStorageSpy.isTokenValid.and.returnValue(true);
      expect(service.isTokenValid()).toBe(true);
      expect(tokenStorageSpy.isTokenValid).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', () => {
      const user = service.getCurrentUser();
      expect(user).toBe(mockClient);
    });
  });

  describe('getAuthenticatedClient', () => {
    it('should get authenticated client', () => {
      clientServiceSpy.getAuthenticatedClient.and.returnValue(of(mockAuthenticatedClient));
      
      service.getAuthenticatedClient().subscribe(client => {
        expect(client).toBe(mockAuthenticatedClient);
      });
    });
  });

  describe('updateUserData', () => {
    it('should update user data', () => {
      const newUser = { ...mockClient, businessName: 'Updated Business' };
      service.updateUserData(newUser);
      expect(authStateSpy.setUser).toHaveBeenCalledWith(newUser);
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
      tokenStorageSpy.getToken.and.returnValue('mock-token');
      
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
      (authStateSpy.user as jasmine.Spy).and.returnValue(adminClient);
      expect(service.isAdmin()).toBe(true);
    });

    it('should check if user has accepted terms', () => {
      expect(service.hasAcceptedTerms()).toBe(true);
      
      const clientWithoutTerms = { ...mockClient, termAccepted: false };
      (authStateSpy.user as jasmine.Spy).and.returnValue(clientWithoutTerms);
      expect(service.hasAcceptedTerms()).toBe(false);
    });

    it('should check if user has specific role', () => {
      expect(service.hasRole(Role.CLIENT)).toBe(true);
      expect(service.hasRole(Role.ADMIN)).toBe(false);
    });
  });

  describe('token management', () => {
    it('should get token', () => {
      tokenStorageSpy.getToken.and.returnValue('mock-token');
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
