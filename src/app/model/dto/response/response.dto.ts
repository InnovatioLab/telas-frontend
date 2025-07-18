export interface ResponseDto<T = any> {
  data: T;
  status: number;
  message: string;
  timestamp?: string;
  success?: boolean;
} 