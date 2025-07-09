export interface FilterBoxRequestDto {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  genericFilter?: string;
  active?: boolean;
}
