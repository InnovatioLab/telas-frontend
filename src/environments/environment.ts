export interface Environment {
  production: boolean;
  apiUrl: string;
  emailSuporte: string;
  zipCodeApiKey: string;
  googleMapsApiKey: string;
  stripePublicKey: string;
  stripePrivateKey: string;
  nomeToken: string;
  nomeTokenRefresh: string;
}

export const environment: Environment = {
  production: false,
  apiUrl: import.meta.env['NG_APP_API'],
  emailSuporte: import.meta.env['NG_APP_EMAIL_SUPORTE'],
  zipCodeApiKey: import.meta.env['NG_APP_ZIP_CODE_API_KEY'],
  googleMapsApiKey: import.meta.env['NG_APP_GOOGLE_MAPS_API_KEY'],
  stripePublicKey: import.meta.env['NG_APP_STRIPE_PUBLIC_KEY'],
  stripePrivateKey: import.meta.env['NG_APP_STRIPE_PRIVATE_KEY'],
  nomeToken: 'diamond_blank_token',
  nomeTokenRefresh: 'diamond_blank_token_refresh',
};


