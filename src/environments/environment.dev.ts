import { apiBaseUrl } from './api-base-url';

export const environment = {
  production: false,
  apiUrl: apiBaseUrl(import.meta.env['NG_APP_API']),
  zipCodeApiKey: import.meta.env.NG_APP_ZIPCODE_API_KEY,
  googleMapsApiKey: import.meta.env.NG_APP_GOOGLE_MAPS_API_KEY,
  nomeToken: 'diamond_blank_token',
  nomeTokenRefresh: 'diamond_blank_token_refresh',
};
