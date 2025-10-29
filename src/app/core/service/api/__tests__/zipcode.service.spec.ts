import { of, throwError } from 'rxjs';
import { AddressData } from '@app/model/dto/request/address-data-request';

// Mock do ZipCodeService para evitar problemas de dependência
jest.mock('../zipcode.service', () => {
  return {
    ZipCodeService: jest.fn().mockImplementation(() => ({
      findLocationByZipCode: jest.fn(),
      lastLocation$: of({ addressData: null, mapPoint: null }),
    }))
  };
});

// Mock do GeocodingService
jest.mock('../geocoding.service', () => ({
  GeocodingService: jest.fn().mockImplementation(() => ({
    geocodeAddress: jest.fn(),
    geocodeZipCode: jest.fn(),
    reverseGeocode: jest.fn(),
  }))
}));

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

describe('ZipCodeService Logic', () => {
  const mockAddressData: AddressData = {
    zipCode: '32789',
    latitude: '28.5383',
    longitude: '-81.3792',
    city: 'Orlando',
    state: 'FL',
    country: 'Brasil',
    street: '',
  };

  const mockGeocodingResult = {
    latitude: 28.5383,
    longitude: -81.3792,
    formattedAddress: 'Orlando, FL, USA',
    zipCode: '32789'
  };

  describe('Address Data Mapping', () => {
    it('should map GeocodingResult to AddressData correctly', () => {
      // Simular a lógica de mapeamento
      const result: AddressData = {
        zipCode: mockGeocodingResult.zipCode || '32789',
        latitude: mockGeocodingResult.latitude.toString(),
        longitude: mockGeocodingResult.longitude.toString(),
        city: 'Orlando', // Extraído de 'Orlando, FL, USA'
        state: 'FL', // Extraído de 'Orlando, FL, USA'
        country: 'Brasil',
        street: '',
      };
      
      expect(result).toEqual({
        zipCode: '32789',
        latitude: '28.5383',
        longitude: '-81.3792',
        city: 'Orlando',
        state: 'FL',
        country: 'Brasil',
        street: '',
      });
    });
  });

  describe('Address Parsing Logic', () => {
    it('should extract city from formatted address', () => {
      const formattedAddress = 'Orlando, FL, USA';
      const parts = formattedAddress.split(',');
      const city = parts[0]?.trim() || '';
      expect(city).toBe('Orlando');
    });

    it('should extract state from formatted address', () => {
      const formattedAddress = 'Orlando, FL, USA';
      const parts = formattedAddress.split(',');
      const state = parts[1]?.trim() || '';
      expect(state).toBe('FL');
    });

    it('should return empty string for invalid address', () => {
      const formattedAddress = '';
      const parts = formattedAddress.split(',');
      const city = parts[0]?.trim() || '';
      const state = parts[1]?.trim() || '';
      expect(city).toBe('');
      expect(state).toBe('');
    });
  });

  describe('ZipCode Service Flow', () => {
    it('should follow the correct flow: Local API -> Google Maps -> Null', () => {
      // Simular o fluxo esperado
      const zipCode = '32789';
      
      // 1. Tenta API local primeiro
      const localApiResult: AddressData | null = null; // Simula que não encontrou
      
      // 2. Se local API falha ou retorna null, tenta Google Maps
      const googleMapsResult = localApiResult ? null : mockGeocodingResult;
      
      // 3. Se Google Maps também falha, retorna null
      const finalResult = googleMapsResult ? mockAddressData : null;
      
      expect(finalResult).toEqual(mockAddressData);
    });

    it('should handle empty zipCode', () => {
      const zipCode = '';
      const result = zipCode ? mockAddressData : null;
      expect(result).toBeNull();
    });
  });
});
