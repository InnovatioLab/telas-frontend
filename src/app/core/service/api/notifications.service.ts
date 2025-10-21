import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Notification } from "@app/modules/notificacao/models/notification";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { environment } from "src/environments/environment";

interface FetchNotificationsRequest {
  ids: string[];
}

@Injectable({
  providedIn: "root",
})
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}notifications`;
  private readonly storageName = "telas_token";

  private readonly _allNotifications = signal<Notification[]>([]);
  private readonly _currentlyVisibleCount = signal<number>(10);

  public readonly visibleNotifications = computed(() => {
    const all = this._allNotifications() || [];
    const count = this._currentlyVisibleCount() || 0;
    return Array.isArray(all) ? all.slice(0, count) : [];
  });

  public readonly totalNotifications = computed(() => {
    const all = this._allNotifications() || [];
    return Array.isArray(all) ? all.length : 0;
  });

  public readonly hasMoreToLoad = computed(
    () => this._currentlyVisibleCount() < this.totalNotifications()
  );

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      Authorization: `Bearer ${token || ""}`,
    });
  }

  public fetchAllNotifications(
    body: FetchNotificationsRequest = { ids: [] }
  ): Observable<void> {
    return this.http
      .get<any>(this.apiUrl, {
        headers: this.getHeaders(),
        params: (body.ids || []).reduce(
          (p, id) => p.append("ids", id),
          new HttpParams()
        ),
      })
      .pipe(
        tap((response) => {
          // Backend wraps in ResponseDto: { data, mensagem, status, ... }
          const payload = (response && (response.data ?? response)) as any;
          const list = Array.isArray(payload) ? payload : [];
          this._allNotifications.set(list as Notification[]);
        }),
        map((): void => void 0),
        catchError((error) => {
          console.error("Erro ao buscar notificações:", error);
          this._allNotifications.set([]);
          return of(void 0);
        })
      );
  }

  public markAsRead(id: string): void {
    const all = this._allNotifications() || [];
    const notification = all.find((n) => n.id === id);

    if (notification && !notification.visualized) {
      const request: FetchNotificationsRequest = {
        ids: [id],
      };

      this.fetchAllNotifications(request).subscribe(() => {
        this._allNotifications.update((notifications) =>
          (notifications || []).map((n) =>
            n.id === id ? { ...n, visualized: true } : n
          )
        );
      });
    }
  }

  public markAllAsRead(): void {
    const unreadIds = (this._allNotifications() || [])
      .filter((n) => !n.visualized)
      .map((n) => n.id);
    if (unreadIds.length > 0) {
      this.fetchAllNotifications({ ids: unreadIds }).subscribe(() => {
        this._allNotifications.update((notifications) =>
          (notifications || []).map((n) => ({ ...n, visualized: true }))
        );
      });
    }
  }

  public loadMore(): void {
    if (this.hasMoreToLoad()) {
      this._currentlyVisibleCount.update((count) => count + 10);
    }
  }

  public resetState(): void {
    this._allNotifications.set([]);
    this._currentlyVisibleCount.set(10);
  }

  public resetCount(): void {
    this._currentlyVisibleCount.set(10);
  }
}
