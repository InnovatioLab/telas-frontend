import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Notification } from '@app/modules/notificacao/models/notification';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}notifications`;
  private readonly storageName = 'telas_token';

  private readonly _allNotifications = signal<Notification[]>([]);
  private readonly _currentlyVisibleCount = signal<number>(10);
  public readonly visibleNotifications = computed(() =>
    this._allNotifications().slice(0, this._currentlyVisibleCount())
  );

  public readonly totalNotifications = computed(() => this._allNotifications().length);
  public readonly hasMoreToLoad = computed(() => this._currentlyVisibleCount() < this.totalNotifications());

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(this.storageName);
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  public fetchAllNotifications(body: any = {}): Observable<void> {
    return this.http
      .request<Notification[]>('get', this.apiUrl, { 
        headers: this.getHeaders(),
        body: body
      })
      .pipe(
        tap((notifications) => {
          this._allNotifications.set(notifications);
        }),
        map((): void => void 0),
        catchError((error) => {
          console.error('Erro ao buscar notificações:', error);
          this._allNotifications.set([]);
          return of(void 0)
        }),
      );
  }

  public markAsRead(id: string): void {
    const notification = this._allNotifications().find(n => n.id === id);
    if (notification && !notification.visualized) {
      this.fetchAllNotifications({ ids: [id] }).subscribe(() => {
        this._allNotifications.update(notifications => 
          notifications.map(n => n.id === id ? { ...n, visualized: true } : n)
        );
      });
    }
  }

  public markAllAsRead(): void {
    const unreadIds = this._allNotifications().filter(n => !n.visualized).map(n => n.id);
    if (unreadIds.length > 0) {
      this.fetchAllNotifications({ ids: unreadIds }).subscribe(() => {
        this._allNotifications.update(notifications => 
          notifications.map(n => ({ ...n, visualized: true }))
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
}
