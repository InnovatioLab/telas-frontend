import { Injectable, signal, computed } from '@angular/core';
import { Client } from '@app/model/client';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly _user = signal<Client | null>(null);
  private readonly _isAuthenticated = computed(() => !!this._user());
  private readonly _isLoading = signal(false);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;
  readonly isLoading = this._isLoading.asReadonly();

  constructor() {
    // Optionally, initialize state from localStorage if needed
    const storedUser = localStorage.getItem('telas_token_user');
    if (storedUser) {
      this._user.set(JSON.parse(storedUser));
    }
  }

  setUser(user: Client | null): void {
    this._user.set(user);
    if (user) {
      localStorage.setItem('telas_token_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('telas_token_user');
    }
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  clear(): void {
    this._user.set(null);
    localStorage.removeItem('telas_token_user');
  }
}


