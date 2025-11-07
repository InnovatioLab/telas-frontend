import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HeaderStateService {
  private readonly _isMenuOpen = signal(false);
  private readonly _isMobileMenuOpen = signal(false);
  private readonly _isDarkMode = signal(false);
  private readonly _isAdminSidebarVisible = signal(false);
  private readonly _isNotificationsSidebarVisible = signal(false);
  private readonly _isMobile = signal(false);

  readonly isMenuOpen = this._isMenuOpen.asReadonly();
  readonly isMobileMenuOpen = this._isMobileMenuOpen.asReadonly();
  readonly isDarkMode = this._isDarkMode.asReadonly();
  readonly isAdminSidebarVisible = this._isAdminSidebarVisible.asReadonly();
  readonly isNotificationsSidebarVisible = this._isNotificationsSidebarVisible.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();

  constructor() {
    // Initialize admin sidebar visibility from localStorage
    const savedVisibility = localStorage.getItem('admin_sidebar_visible');
    if (savedVisibility === 'true') {
      this._isAdminSidebarVisible.set(true);
    }
  }

  toggleMenu(): void {
    this._isMenuOpen.update(open => !open);
  }

  toggleMobileMenu(): void {
    this._isMobileMenuOpen.update(open => !open);
  }

  toggleDarkMode(): void {
    this._isDarkMode.update(mode => !mode);
  }

  toggleAdminSidebar(): void {
    this._isAdminSidebarVisible.update(visible => !visible);
    localStorage.setItem(
      'admin_sidebar_visible',
      this._isAdminSidebarVisible().toString()
    );
  }

  toggleNotificationsSidebar(): void {
    this._isNotificationsSidebarVisible.update(visible => !visible);
  }

  setMobile(isMobile: boolean): void {
    this._isMobile.set(isMobile);
  }

  setMenuOpen(isOpen: boolean): void {
    this._isMenuOpen.set(isOpen);
  }

  setMobileMenuOpen(isOpen: boolean): void {
    this._isMobileMenuOpen.set(isOpen);
  }

  setDarkMode(isDark: boolean): void {
    this._isDarkMode.set(isDark);
  }

  setAdminSidebarVisible(isVisible: boolean): void {
    this._isAdminSidebarVisible.set(isVisible);
  }

  setNotificationsSidebarVisible(isVisible: boolean): void {
    this._isNotificationsSidebarVisible.set(isVisible);
  }

  closeAllMenus(): void {
    this._isMenuOpen.set(false);
    this._isMobileMenuOpen.set(false);
  }

  updateScreenSize(): void {
    const newIsMobile = window.innerWidth <= 768;
    this.setMobile(newIsMobile);
    
    // Update mobile menu state based on screen size and menu state
    this.setMobileMenuOpen(this.isMenuOpen() && newIsMobile);
  }
}






