export interface PaginationResponseDto<T> {
  list: T[];
  totalElements?: number;
  totalRecords?: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
} 