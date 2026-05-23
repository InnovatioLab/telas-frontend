import { of, throwError } from "rxjs";
import { LazyTableController } from "../lazy-table.controller";

describe("LazyTableController", () => {
  it("loads items and total records", () => {
    const controller = new LazyTableController(
      { page: 1, size: 10, sortBy: "id", sortDir: "asc" },
      () => of({ list: [{ id: "1" }], totalElements: 1 })
    );

    controller.load();

    expect(controller.loading).toBe(false);
    expect(controller.items).toEqual([{ id: "1" }]);
    expect(controller.totalRecords).toBe(1);
  });

  it("resets page on search", () => {
    const controller = new LazyTableController(
      { page: 3, size: 10 },
      () => of({ list: [], totalElements: 0 })
    );

    controller.onSearch();

    expect(controller.currentFilters.page).toBe(1);
  });

  it("updates pagination from lazy event", () => {
    const controller = new LazyTableController(
      { page: 1, size: 10 },
      () => of({ list: [], totalElements: 0 })
    );

    controller.onPageChange({ first: 20, rows: 10 });

    expect(controller.currentFilters.page).toBe(3);
    expect(controller.currentFilters.size).toBe(10);
  });

  it("applies generic filter when search term is set", () => {
    let capturedFilter: { page: number; size: number; genericFilter?: string } | undefined;
    const controller = new LazyTableController(
      { page: 1, size: 10 },
      (filters) => {
        capturedFilter = filters;
        return of({ list: [], totalElements: 0 });
      }
    );

    controller.setSearchTerm("box-1");
    controller.load();

    expect(capturedFilter?.genericFilter).toBe("box-1");
  });

  it("calls onError when load fails", () => {
    const onError = jest.fn();
    const controller = new LazyTableController(
      { page: 1, size: 10 },
      () => throwError(() => new Error("fail")),
      onError
    );

    controller.load();

    expect(onError).toHaveBeenCalled();
    expect(controller.loading).toBe(false);
  });
});
