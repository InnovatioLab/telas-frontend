import { computed, Injectable, signal } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface LayoutState {
  menuOpen: boolean;
  menuType: "client" | "admin" | null;
  isMobile: boolean;
  isMobileCompact: boolean;
  sidebarWidth: number;
  mobileSidebarWidth: number;
}

@Injectable({
  providedIn: "root",
})
export class LayoutService {
  private _layoutState = signal<LayoutState>({
    menuOpen: false,
    menuType: null,
    isMobile: false,
    isMobileCompact: false,
    sidebarWidth: 200,
    mobileSidebarWidth: 200,
  });

  public layoutState = this._layoutState.asReadonly();

  // Computed values
  public isMenuOpen = computed(() => this._layoutState().menuOpen);
  public menuType = computed(() => this._layoutState().menuType);
  public isMobile = computed(() => this._layoutState().isMobile);
  public isMobileCompact = computed(() => this._layoutState().isMobileCompact);
  public currentSidebarWidth = computed(() => {
    const state = this._layoutState();
    if (state.isMobileCompact) {
      return state.menuOpen ? 70 : 0;
    }
    if (state.isMobile) {
      return state.menuOpen ? state.mobileSidebarWidth : 0;
    }
    return state.menuOpen ? state.sidebarWidth : 0;
  });

  public contentMargin = computed(() => {
    const state = this._layoutState();
    if (state.isMobileCompact) {
      return state.menuOpen ? 70 : 0;
    }
    if (state.isMobile) {
      return state.menuOpen ? state.mobileSidebarWidth : 0;
    }
    return state.menuOpen ? state.sidebarWidth : 0;
  });

  public layoutChange$ = new BehaviorSubject<LayoutState>(this._layoutState());

  constructor() {
    this.initializeLayout();
    this.setupResizeListener();
  }

  private initializeLayout(): void {
    const isMobile = window.innerWidth <= 768;
    const isMobileCompact = window.innerWidth <= 550;
    this.updateState({ isMobile, isMobileCompact });
  }

  private setupResizeListener(): void {
    window.addEventListener("resize", () => {
      const isMobile = window.innerWidth <= 768;
      const isMobileCompact = window.innerWidth <= 550;

      if (
        isMobile !== this._layoutState().isMobile ||
        isMobileCompact !== this._layoutState().isMobileCompact
      ) {
        this.updateState({ isMobile, isMobileCompact });
      }
    });
  }

  private updateState(updates: Partial<LayoutState>): void {
    const oldState = this._layoutState();
    const newState = { ...oldState, ...updates };

    this._layoutState.set(newState);
    this.layoutChange$.next(newState);
  }

  openMenu(type: "client" | "admin"): void {
    this.updateState({ menuOpen: true, menuType: type });
  }

  closeMenu(): void {
    this.updateState({ menuOpen: false });
  }

  toggleMenu(type: "client" | "admin"): void {
    const currentState = this._layoutState();

    if (currentState.menuOpen && currentState.menuType === type) {
      this.closeMenu();
    } else {
      this.openMenu(type);
    }
  }

  getMenuClasses(): string {
    const state = this._layoutState();
    const classes = ["menu-side-container"];

    if (state.menuOpen) classes.push("active");
    if (state.isMobile) classes.push("mobile");
    if (state.isMobileCompact) classes.push("mobile-compact");

    return classes.join(" ");
  }

  getContentClasses(): string {
    const state = this._layoutState();
    const classes = ["content-wrapper"];

    if (state.menuOpen) classes.push("menu-active");
    if (state.isMobile) classes.push("mobile");
    if (state.isMobileCompact) classes.push("mobile-compact");

    return classes.join(" ");
  }
}
