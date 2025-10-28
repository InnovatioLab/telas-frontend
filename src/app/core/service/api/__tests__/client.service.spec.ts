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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ClientService } from '../client.service';

describe('ClientService - Teste Básico', () => {
  let service: ClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientService],
    });

    service = TestBed.inject(ClientService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve ter URL configurada', () => {
    expect(service.url).toContain('clients');
  });

  it('deve ter BehaviorSubject clientAtual$', () => {
    expect(service.clientAtual$).toBeDefined();
  });

  it('deve ter Subject cancelarEdicao$', () => {
    expect(service.cancelarEdicao$).toBeDefined();
  });
});

