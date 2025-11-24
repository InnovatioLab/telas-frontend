import { InjectionToken } from '@angular/core';

/**
 * Interface para configuração de ambiente
 */
export interface IEnvironmentConfig {
  production: boolean;
  apiUrl: string;
  googleMapsApiKey: string;
  version: string;
  buildDate: string;
  features: IFeatureFlags;
}

/**
 * Interface para feature flags
 */
export interface IFeatureFlags {
  enableDarkMode: boolean;
  enableNotifications: boolean;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  enableBetaFeatures: boolean;
}

/**
 * Interface para configuração de API
 */
export interface IApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  headers: Record<string, string>;
  endpoints: IApiEndpoints;
}

/**
 * Interface para endpoints da API
 */
export interface IApiEndpoints {
  auth: {
    login: string;
    logout: string;
    refresh: string;
    register: string;
  };
  client: {
    profile: string;
    update: string;
    delete: string;
    ads: string;
    attachments: string;
  };
  monitors: {
    list: string;
    create: string;
    update: string;
    delete: string;
    search: string;
  };
  maps: {
    geocoding: string;
    places: string;
    directions: string;
  };
}

/**
 * Interface para configuração de Google Maps
 */
export interface IGoogleMapsConfig {
  apiKey: string;
  libraries: string[];
  language: string;
  region: string;
  defaultZoom: number;
  defaultCenter: {
    lat: number;
    lng: number;
  };
  mapOptions: google.maps.MapOptions;
}

/**
 * Interface para configuração de PrimeNG
 */
export interface IPrimeNGConfig {
  theme: string;
  ripple: boolean;
  inputStyle: 'outlined' | 'filled';
  animation: boolean;
  zIndex: {
    modal: number;
    overlay: number;
    menu: number;
    tooltip: number;
  };
}

/**
 * Interface para configuração de validação
 */
export interface IValidationConfig {
  emailPattern: RegExp;
  phonePattern: RegExp;
  passwordPattern: RegExp;
  zipCodePattern: RegExp;
  minPasswordLength: number;
  maxPasswordLength: number;
  maxFileSize: number;
  allowedFileTypes: string[];
}

/**
 * Interface para configuração de notificações
 */
export interface INotificationConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration: number;
  maxNotifications: number;
  enableSound: boolean;
  enableVibration: boolean;
}

/**
 * Interface para configuração de cache
 */
export interface ICacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number;
  storageType: 'memory' | 'localStorage' | 'sessionStorage';
}

/**
 * Interface para configuração de logging
 */
export interface ILoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint: string;
  enablePerformance: boolean;
}

/**
 * Interface para configuração de segurança
 */
export interface ISecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableContentTypeOptions: boolean;
  enableFrameOptions: boolean;
  tokenExpirationTime: number;
  refreshTokenExpirationTime: number;
}

/**
 * Interface principal de configuração da aplicação
 */
export interface IAppConfig {
  environment: IEnvironmentConfig;
  api: IApiConfig;
  googleMaps: IGoogleMapsConfig;
  primeNG: IPrimeNGConfig;
  validation: IValidationConfig;
  notifications: INotificationConfig;
  cache: ICacheConfig;
  logging: ILoggingConfig;
  security: ISecurityConfig;
}

/**
 * Tokens de injeção para configurações
 */
export const ENVIRONMENT_CONFIG = new InjectionToken<IEnvironmentConfig>('ENVIRONMENT_CONFIG');
export const API_CONFIG = new InjectionToken<IApiConfig>('API_CONFIG');
export const GOOGLE_MAPS_CONFIG = new InjectionToken<IGoogleMapsConfig>('GOOGLE_MAPS_CONFIG');
export const PRIMENG_CONFIG = new InjectionToken<IPrimeNGConfig>('PRIMENG_CONFIG');
export const VALIDATION_CONFIG = new InjectionToken<IValidationConfig>('VALIDATION_CONFIG');
export const NOTIFICATION_CONFIG = new InjectionToken<INotificationConfig>('NOTIFICATION_CONFIG');
export const CACHE_CONFIG = new InjectionToken<ICacheConfig>('CACHE_CONFIG');
export const LOGGING_CONFIG = new InjectionToken<ILoggingConfig>('LOGGING_CONFIG');
export const SECURITY_CONFIG = new InjectionToken<ISecurityConfig>('SECURITY_CONFIG');
export const APP_CONFIG = new InjectionToken<IAppConfig>('APP_CONFIG');














