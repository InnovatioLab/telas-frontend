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
  id?: string;
  code?: string;
  expirationDate?: string;
}

export interface Contact {
  id?: string;
  email?: string;
  phone?: string;
  contactPreference?: ContactPreference;
}

export interface Owner {
  id?: string;
  identificationNumber?: string;
  firstName?: string; 
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface SocialMedia {
  id?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  tiktokUrl?: string;
}

export interface Address {
  id?: string;
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
  id?: string;
  fileName?: string;
  fileType?: string;
  url?: string;
}

export interface Ad {
  id?: string;
  title?: string;
  description?: string;
  validation?: AdValidationType;
}

export interface Notification {
  id?: string;
  message?: string;
  createdAt?: string;
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
