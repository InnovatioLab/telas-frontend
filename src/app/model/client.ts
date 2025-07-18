export interface Client {
  id?: string; 
  businessName?: string;
  identificationNumber?: string;
  password?: string;
  role?: Role;
  industry?: string;
  websiteUrl?: string;
  status?: DefaultStatus;
  termAccepted?: boolean;
  termCondition?: TermCondition;
  verificationCode?: VerificationCode;
  contact?: Contact;
  owner?: Owner;
  socialMedia?: SocialMedia;
  addresses?: Address[];
  attachments?: Attachment[];
  ads?: Ad[];
  notifications?: Notification[];
  currentSubscriptionFlowStep?: number;
  cart?: CartResponse;

}

export interface TermCondition {
  id?: string;
  version?: string;
  content?: string;
}

export interface VerificationCode {
  id?: string; // UUID
  code?: string;
  expirationDate?: string;
}

export interface Contact {
  id?: string; // UUID
  email?: string;
  phone?: string;
  contactPreference?: ContactPreference;
}

export interface Owner {
  id?: string; // UUID
  identificationNumber?: string;
  firstName?: string; 
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface SocialMedia {
  id?: string; // UUID
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
}

export interface Address {
  id?: string; // UUID
  street?: string;
  number?: string;
  complement?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  partnerAddress?: boolean;
  coordinatesParams?: string;
}

export interface Attachment {
  id?: string; // UUID
  fileName?: string;
  fileType?: string;
  url?: string;
}

export interface Ad {
  id?: string; // UUID
  title?: string;
  description?: string;
  validation?: AdValidationType;
}

export interface Notification {
  id?: string; // UUID
  message?: string;
  createdAt?: string; // ISO timestamp
}

export interface CartResponse {
  id?: string;
}

export enum Role {
  CLIENT = 'CLIENT',
  PARTNER = 'PARTNER',
  ADMIN = 'ADMIN',
}

export enum DefaultStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ContactPreference {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export enum AdValidationType {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
