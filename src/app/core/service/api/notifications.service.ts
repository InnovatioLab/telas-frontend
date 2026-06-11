import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Notification } from "@app/modules/notification/models/notification";
import { Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

export interface NotificationFilters {
  search?: string;
  references?: string[];
}

interface PageResponse<T> {
  content: T[];
  last: boolean;
  totalElements: number;
}

@Injectable({
  providedIn: "root",
})
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}notifications`;
  private readonly storageName = "telas_token";

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _page = signal(0);
  private readonly _hasMore = signal(false);
  private readonly _loading = signal(false);
  private _fetchSeq = 0;

  public readonly notifications = this._notifications.asReadonly();
  public readonly hasMore = this._hasMore.asReadonly();
  public readonly loading = this._loading.asReadonly();

  public readonly visibleNotifications = this._notifications.asReadonly();
  public readonly allNotifications = this._notifications.asReadonly();
  public readonly totalNotifications = computed(() => this._notifications().length);
  public readonly hasMoreToLoad = this._hasMore.asReadonly();

  public readonly unreadCount = computed(() =>
    this._notifications().filter((n) => n && !n.visualized).length
  );

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({ Authorization: `Bearer ${token || ""}` });
  }

  public fetchPage(filters: NotificationFilters, page: number): void {
    if (this._loading()) return;
    this._loading.set(true);
    const seq = ++this._fetchSeq;

    const params = this.buildParams(filters, page, 10);
    this.http
      .get<any>(this.apiUrl, { headers: this.getHeaders(), params })
      .subscribe({
        next: (response) => {
          if (seq !== this._fetchSeq) return;
          const pageData = (response?.data ?? response) as PageResponse<Notification>;
          const items: Notification[] = Array.isArray(pageData?.content) ? pageData.content : [];
          this._notifications.update((prev) => (page === 0 ? items : [...prev, ...items]));
          this._page.set(page);
          this._hasMore.set(!(pageData?.last ?? true));
          this._loading.set(false);
        },
        error: () => {
          if (seq !== this._fetchSeq) return;
          if (page === 0) this._notifications.set([]);
          this._loading.set(false);
        },
      });
  }

  public loadNextPage(filters: NotificationFilters): void {
    if (!this._hasMore() || this._loading()) return;
    this.fetchPage(filters, this._page() + 1);
  }

  public resetAndFetch(filters: NotificationFilters): void {
    this._fetchSeq++;
    this._notifications.set([]);
    this._page.set(0);
    this._hasMore.set(false);
    this._loading.set(false);
    this.fetchPage(filters, 0);
  }

  private buildParams(filters: NotificationFilters, page: number, size: number): HttpParams {
    let p = new HttpParams().set("page", page).set("size", size);
    (filters.references ?? []).forEach((ref) => (p = p.append("reference", ref)));
    if (filters.search?.trim()) p = p.set("search", filters.search.trim());
    return p;
  }

  public fetchAllNotifications(body: { ids?: string[] } = {}): Observable<void> {
    let params = new HttpParams().set("size", "200").set("page", "0");
    (body.ids ?? []).forEach((id) => (params = params.append("ids", id)));
    return this.http
      .get<any>(this.apiUrl, { headers: this.getHeaders(), params })
      .pipe(
        map((response) => {
          const pageData = (response?.data ?? response) as PageResponse<Notification>;
          const items: Notification[] = Array.isArray(pageData?.content) ? pageData.content : [];
          this._notifications.set(items);
          this._hasMore.set(false);
        }),
        catchError(() => of(void 0))
      );
  }

  public markAsRead(id: string): void {
    const notification = this._notifications().find((n) => n.id === id);
    if (!notification || notification.visualized) return;

    this._notifications.update((notifications) =>
      notifications.map((n) => (n.id === id ? { ...n, visualized: true } : n))
    );

    const params = new HttpParams().append("ids", id);
    this.http
      .get<any>(this.apiUrl, { headers: this.getHeaders(), params })
      .subscribe();
  }

  public markAllAsRead(): void {
    this._notifications.update((notifications) =>
      notifications.map((n) => ({ ...n, visualized: true }))
    );

    this.http
      .patch<any>(`${this.apiUrl}/mark-all-read`, null, { headers: this.getHeaders() })
      .subscribe();
  }

  public resetState(): void {
    this._notifications.set([]);
    this._page.set(0);
    this._hasMore.set(false);
  }

  public resetCount(): void {
    // no-op: pagination is now server-side
  }

  public refreshAndMarkReferencesAsRead(references: string[]): Observable<void> {
    const refs = (references ?? []).map((r) => String(r).trim()).filter((r) => r.length > 0);
    if (!refs.length) return of(void 0);

    let params = new HttpParams().set("size", "200").set("page", "0");
    refs.forEach((r) => (params = params.append("reference", r)));

    return this.http
      .get<any>(this.apiUrl, { headers: this.getHeaders(), params })
      .pipe(
        switchMap((response) => {
          const pageData = (response?.data ?? response) as PageResponse<Notification>;
          const all: Notification[] = Array.isArray(pageData?.content) ? pageData.content : [];
          const ids = all
            .filter((n) => n && !n.visualized && refs.includes(String(n.reference)))
            .map((n) => n.id)
            .filter((id) => typeof id === "string" && id.length > 0);
          if (!ids.length) return of(void 0);

          let p = new HttpParams();
          ids.forEach((id) => (p = p.append("ids", id)));
          return this.http
            .get<any>(this.apiUrl, { headers: this.getHeaders(), params: p })
            .pipe(
              map(() => {
                this._notifications.update((notifications) =>
                  notifications.map((n) =>
                    refs.includes(String(n.reference)) ? { ...n, visualized: true } : n
                  )
                );
              }),
              catchError(() => of(void 0))
            );
        }),
        catchError(() => of(void 0))
      );
  }

  public markClientMessagesAsRead(clientId: string): Observable<void> {
    const id = String(clientId ?? "").trim();
    if (!id) return of(void 0);
    const clientMessagesUrl = `/admin/clients/${id}/messages`;

    return this.fetchAllNotifications().pipe(
      switchMap(() => {
        const ids = this._notifications()
          .filter((n) => n && !n.visualized)
          .filter((n) => String(n.reference) === "CLIENT_AD_REJECTED")
          .filter((n) => String(n.actionUrl ?? "").includes(clientMessagesUrl))
          .map((n) => n.id)
          .filter((nid) => typeof nid === "string" && nid.length > 0);
        if (!ids.length) return of(void 0);

        let params = new HttpParams();
        ids.forEach((nid) => (params = params.append("ids", nid)));
        return this.http
          .get<any>(this.apiUrl, { headers: this.getHeaders(), params })
          .pipe(
            map((): void => undefined),
            catchError(() => of(void 0))
          );
      })
    );
  }
}
