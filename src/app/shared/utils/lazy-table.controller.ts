import { Observable } from "rxjs";
import {
  resolveLazyTableRequestPage,
  TableLazyPageEvent,
} from "./table-lazy-pagination.utils";

export interface LazyTableFilterState {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
  genericFilter?: string;
}

export interface LazyTableLoadResult<T> {
  list: T[];
  totalElements: number;
}

export type LazyTableLoader<T, F extends LazyTableFilterState> = (
  filters: F
) => Observable<LazyTableLoadResult<T>>;

export class LazyTableController<T, F extends LazyTableFilterState> {
  items: T[] = [];
  loading = false;
  totalRecords = 0;
  searchTerm = "";

  private isSorting = false;
  private readonly filters: F;

  constructor(
    initialFilters: F,
    private readonly loadFn: LazyTableLoader<T, F>,
    private readonly onError?: (error: unknown) => void
  ) {
    this.filters = { ...initialFilters };
  }

  get currentFilters(): F {
    return this.filters;
  }

  setSearchTerm(term: string): void {
    this.searchTerm = term;
  }

  applyGenericFilterTo(filters: F): F {
    const next = { ...filters };
    const trimmed = this.searchTerm.trim();
    if (trimmed) {
      next.genericFilter = trimmed;
    } else {
      delete next.genericFilter;
    }
    return next;
  }

  load(): void {
    this.loading = true;
    const requestFilters = this.applyGenericFilterTo(this.filters);

    this.loadFn(requestFilters).subscribe({
      next: (result) => {
        this.items = result.list;
        this.totalRecords = result.totalElements;
        this.loading = false;
        this.isSorting = false;
      },
      error: (error) => {
        this.loading = false;
        this.isSorting = false;
        this.onError?.(error);
      },
    });
  }

  onSearch(): void {
    this.filters.page = 1;
    this.load();
  }

  onPageChange(event: TableLazyPageEvent): void {
    const { page, rows } = resolveLazyTableRequestPage(
      event,
      this.filters.size ?? 10
    );
    this.filters.page = page;
    this.filters.size = rows;
    this.load();
  }

  onSort(event: { field?: string; order?: number }): void {
    if (this.isSorting || this.loading || !event.field) {
      return;
    }

    const newSortBy = event.field;
    const newSortDir = event.order === 1 ? "asc" : "desc";

    if (
      this.filters.sortBy === newSortBy &&
      this.filters.sortDir === newSortDir
    ) {
      return;
    }

    this.isSorting = true;
    this.filters.sortBy = newSortBy;
    this.filters.sortDir = newSortDir;
    this.filters.page = 1;
    this.load();
  }
}
