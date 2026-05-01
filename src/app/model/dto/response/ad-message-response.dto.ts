import { Role } from "@app/model/client";

export interface AdMessageResponseDto {
  id: string;
  senderRole: Role;
  senderName?: string;
  message: string;
  createdAt: string;
}

