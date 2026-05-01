import { Role } from "@app/model/client";

export interface AdminClientMessageRowDto {
  adId?: string | null;
  adName?: string | null;
  messageId: string;
  senderRole: Role;
  senderName?: string | null;
  message: string;
  createdAt: string;
}

