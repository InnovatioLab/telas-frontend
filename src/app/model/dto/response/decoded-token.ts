export interface DecodedToken {
  id: string;
  businessName: string;
  iss?: string;
  sub?: string;
  exp?: number;
  permissions?: string[];
}
