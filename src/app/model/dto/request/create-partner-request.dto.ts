import { ClientRequestDTO } from "./client-request.dto";

export interface CreatePartnerRequestDTO extends ClientRequestDTO {
  password: string;
  confirmPassword: string;
}
