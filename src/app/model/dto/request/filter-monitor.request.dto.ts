import { PaginationRequestDto } from './pagination-request.dto';

export interface FilterMonitorRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
} 