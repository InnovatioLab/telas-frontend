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
import { ZipCodeRepositoryImpl } from '../zipcode-repository.impl';
import { AddressData } from '@app/model/dto/request/address-data-request';
import { ResponseDTO } from '@app/model/dto/response.dto';
import { LocalAddressResponse } from '@app/model/dto/response/local-address-response';

describe('ZipCodeRepositoryImpl', () => {
  let service: ZipCodeRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ZipCodeRepositoryImpl]
    });
    service = TestBed.inject(ZipCodeRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findByZipCode', () => {
    it('should return address data for valid zip code', () => {
      const mockResponse: ResponseDTO<LocalAddressResponse> = {
        data: {
          zipCode: '12345',
          city: 'Test City',
          state: 'TS',
          country: 'Brasil',
          street: 'Test Street',
          latitude: '40.7128',
          longitude: '-74.0060'
        }
      };

      service.findByZipCode('12345').subscribe(result => {
        expect(result).toEqual({
          zipCode: '12345',
          city: 'Test City',
          state: 'TS',
          country: 'Brasil',
          street: 'Test Street',
          latitude: '40.7128',
          longitude: '-74.0060'
        });
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/zipcode/12345`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null for empty zip code', () => {
      service.findByZipCode('').subscribe(result => {
        expect(result).toBeNull();
      });

      httpMock.expectNone(`${service['baseUrl']}/zipcode/`);
    });

    it('should return null on API error', () => {
      service.findByZipCode('12345').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/zipcode/12345`);
      req.error(new ErrorEvent('API error'));
    });
  });

  describe('saveAddress', () => {
    it('should save address successfully', () => {
      const addressData: AddressData = {
        zipCode: '12345',
        city: 'Test City',
        state: 'TS',
        country: 'Brasil',
        street: 'Test Street',
        latitude: '40.7128',
        longitude: '-74.0060'
      };

      const mockResponse: ResponseDTO<AddressData> = {
        data: addressData
      };

      service.saveAddress(addressData).subscribe(result => {
        expect(result).toEqual(addressData);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(addressData);
      req.flush(mockResponse);
    });

    it('should handle save error', () => {
      const addressData: AddressData = {
        zipCode: '12345',
        city: 'Test City',
        state: 'TS',
        country: 'Brasil',
        street: 'Test Street',
        latitude: '40.7128',
        longitude: '-74.0060'
      };

      service.saveAddress(addressData).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${service['baseUrl']}`);
      req.error(new ErrorEvent('Save error'));
    });
  });

  describe('findAddressesByZipCode', () => {
    it('should return array of addresses', () => {
      const mockResponse: ResponseDTO<AddressData[]> = {
        data: [
          {
            zipCode: '12345',
            city: 'Test City',
            state: 'TS',
            country: 'Brasil',
            street: 'Test Street',
            latitude: '40.7128',
            longitude: '-74.0060'
          }
        ]
      };

      service.findAddressesByZipCode('12345').subscribe(result => {
        expect(result).toEqual(mockResponse.data);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/zipcode/12345/all`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array for empty zip code', () => {
      service.findAddressesByZipCode('').subscribe(result => {
        expect(result).toEqual([]);
      });

      httpMock.expectNone(`${service['baseUrl']}/zipcode//all`);
    });

    it('should return empty array on error', () => {
      service.findAddressesByZipCode('12345').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/zipcode/12345/all`);
      req.error(new ErrorEvent('API error'));
    });
  });
});
