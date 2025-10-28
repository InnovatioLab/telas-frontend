/// <reference types="jest" />

// Mock do localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock do sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock do Google Maps
Object.defineProperty(window, 'google', {
  value: {
    maps: {
      Map: jest.fn(),
      Marker: jest.fn(),
      LatLngBounds: jest.fn(),
      places: {
        PlacesService: jest.fn(),
        Autocomplete: jest.fn(),
      },
    },
  },
  writable: true,
});

// Mock do navigator.geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
  writable: true,
});

// Configuração global de timeout
jest.setTimeout(10000);