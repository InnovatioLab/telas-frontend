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
import { ClientRepositoryImpl } from '../client-repository.impl';
import { environment } from 'src/environments/environment';
import { AuthenticatedClientResponseDto } from '@app/model/dto/response/authenticated-client-response.dto';

describe('ClientRepositoryImpl', () => {
  let repository: ClientRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientRepositoryImpl],
    });
    repository = TestBed.inject(ClientRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAuthenticatedClient deve chamar /clients/authenticated e mapear data', () => {
    const mockData: AuthenticatedClientResponseDto = {
      id: '1',
      businessName: 'ACME',
      role: 'CLIENT',
      status: 'ACTIVE',
      contact: { id: 'c1', email: 'a@a.com', phone: '123' },
      socialMedia: null,
      adRequest: null,
      addresses: [],
      attachments: [],
      ads: [],
      termAccepted: true,
      currentSubscriptionFlowStep: 0,
      hasSubscription: false,
      shouldDisplayAttachments: false,
    };

    repository.getAuthenticatedClient().subscribe((res) => {
      expect(res).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}clients/authenticated`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockData });
  });
});


