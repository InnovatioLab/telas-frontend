export interface ZipCodeResponse {
  query: {
    codes: string[];
    country: string;
  };
  results: {
    [zipcode: string]: {
      postal_code: string;
      country_code: string;
      latitude: string;
      longitude: string;
      city: string;
      state: string;
      city_en: string;
      state_en: string;
      state_code: string;
      province: string;
      province_code: string;
    }[];
  };
}