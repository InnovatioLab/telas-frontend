export interface UploadResponse {
  enviados?: string[];
  falharam?: Array<{arquivo: string, erro: string}>;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
