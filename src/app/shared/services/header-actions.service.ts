import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '@app/core/service/api/cart.service';
import { NotificationsService } from '@app/core/service/api/notifications.service';
import { Authentication } from '@app/core/service/auth/autenthication';
import { ToastService } from '@app/core/service/state/toast.service';
import { Client } from '@app/model/client';

@Injectable({
  providedIn: 'root'
})
export class HeaderActionsService {
  private readonly _cartItemCount = signal(0);
  private readonly _notificationCount = signal(0);
  private readonly _savedItemsCount = signal(0);

  readonly cartItemCount = this._cartItemCount.asReadonly();
  readonly notificationCount = this._notificationCount.asReadonly();
  readonly savedItemsCount = this._savedItemsCount.asReadonly();

  constructor(
    private router: Router,
    private cartService: CartService,
    private notificationsService: NotificationsService,
    private authentication: Authentication,
    private toastService: ToastService
  ) {
    this.initializeSubscriptions();
  }

  private initializeSubscriptions(): void {
    // Subscribe to cart changes
    this.cartService.cartUpdatedStream$.subscribe({
      next: (cart) => {
        if (cart && cart.items) {
          this._cartItemCount.set(cart.items.length);
        } else {
          this._cartItemCount.set(0);
        }
      },
      error: () => {
        this._cartItemCount.set(0);
      },
    });

    // Initialize cart if logged in
    if (this.isLoggedIn()) {
      this.cartService.initializeCart();
    }
  }

  isLoggedIn(): boolean {
    return this.authentication.isTokenValido();
  }

  isAdministrator(): boolean {
    return (
      this.isLoggedIn() && 
      this.authentication?._clientSignal()?.role === "ADMIN"
    );
  }

  getCurrentUser(): Client | null {
    return this.authentication?._clientSignal() || null;
  }

  navigateToLogin(): void {
    this.router.navigate(['/authentication/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToHome(): void {
    if (this.isLoggedIn()) {
      if (this.isAdministrator()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/client']);
      }
    } else {
      this.router.navigate(['/']);
    }
  }

  navigateToAdminProfile(): void {
    if (this.isAdministrator()) {
      if (this.router.url.includes('/admin/profile')) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/admin/profile']);
      }
    }
  }

  openCheckout(): void {
    if (!this.hasActiveCart()) {
      this.toastService.info(
        'Your cart is empty. Add monitors to start shopping.'
      );
      return;
    }
    // The actual checkout opening will be handled by the component
  }

  hasActiveCart(): boolean {
    return this.cartItemCount() > 0;
  }

  getCartTooltip(): string {
    return this.hasActiveCart()
      ? `View your cart (${this.cartItemCount()} items)`
      : 'Your cart is empty';
  }

  updateNotificationCount(count: number): void {
    this._notificationCount.set(count);
  }

  updateSavedItemsCount(count: number): void {
    this._savedItemsCount.set(count);
  }

  updateCartItemCount(count: number): void {
    this._cartItemCount.set(count);
  }
}
