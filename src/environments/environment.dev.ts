export const environment = {
  production: false,
  apiUrl: import.meta.env.NG_APP_API,
  emailSuporte: import.meta.env.NG_APP_EMAIL_SUPORTE,
  zipCodeApiKey: import.meta.env.NG_APP_ZIPCODE_API_KEY,
  googleMapsApiKey: import.meta.env.NG_APP_GOOGLE_MAPS_API_KEY,
  stripePublicKey: import.meta.env.NG_APP_STRIPE_PUBLIC_KEY,
  stripePrivateKey: import.meta.env.NG_APP_STRIPE_PRIVATE_KEY,
  nomeToken: 'diamond_blank_token',
  nomeTokenRefresh: 'diamond_blank_token_refresh',
};
