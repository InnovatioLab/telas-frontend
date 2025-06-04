// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
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


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
