export interface DecodedToken {
  id: string;
  identificationNumber: string;
  businessName: string;
  iss?: string;
  sub?: string;
  exp?: number;
  permissions?: string[];
}
