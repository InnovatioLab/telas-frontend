export interface AvailablePartnerAddressResponseDto {
  addressId: string;
  clientId: string;
  businessName: string | null;
  email: string | null;
  street: string;
  zipCode: string;
  city: string;
  state: string;
  country: string | null;
  address2: string | null;
  label: string;
}
