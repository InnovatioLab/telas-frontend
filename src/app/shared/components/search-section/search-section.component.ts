import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LayoutService } from "@app/core/service/state/layout.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-search-section",
  standalone: true,
  imports: [CommonModule, FormsModule, PrimengModule, IconSearchComponent],
  templateUrl: "./search-section.component.html",
  styleUrls: ["./search-section.component.scss"],
})
export class SearchSectionComponent implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly authentication = inject(Authentication);
  private readonly searchMonitorsService = inject(SearchMonitorsService);
  private readonly toastService = inject(ToastService);

  @Output() monitorsFound = new EventEmitter<MapPoint[]>();

  searchText = "";
  isSearching = false;
  isMobile = this.layoutService.isMobile;
  showSearchSection = false;
  private errorSubscription: Subscription;
  private lastSearchTime = 0;
  private instanceId = Math.random().toString(36).substr(2, 9);

  ngOnInit(): void {
    console.log(
      "SearchSectionComponent initialized - Instance ID:",
      this.instanceId
    );

    // Check initial route
    this.checkRouteVisibility();

    // Subscribe to route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkRouteVisibility();
      });

    // Subscribe to search service errors to show toasts
    this.errorSubscription = this.searchMonitorsService.error$.subscribe(
      (error) => {
        if (error) {
          console.log(
            "Error from service:",
            error,
            "Instance ID:",
            this.instanceId
          );
          this.toastService.erro(error);
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const key = event.key;

    // Allow Ctrl/Cmd+V (paste) and other common Ctrl/Cmd combos like Ctrl+C/Ctrl+X/Ctrl+A
    if ((event.ctrlKey || event.metaKey) && key && key.toLowerCase() === "v") {
      return; // let onPaste handle the paste
    }
    if (
      (event.ctrlKey || event.metaKey) &&
      ["a", "c", "x", "z", "y"].includes((key || "").toLowerCase())
    ) {
      return; // allow common shortcuts
    }

    // Allow navigation and control keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (allowedKeys.includes(key)) {
      return;
    }

    // Allow only single digit characters
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Limit to 5 digits
    if (value.length >= 5) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    // Try to read clipboard synchronously when available, fall back to async or default behavior.
    const input = event.target as HTMLInputElement | null;

    const clipboardData = event.clipboardData || (window as any).clipboardData;

    if (clipboardData && typeof clipboardData.getData === "function") {
      // Synchronous clipboard available on the event
      event.preventDefault();
      const paste = clipboardData.getData("text") || "";
      const numbersOnly = paste.replace(/\D/g, "").slice(0, 5);
      this.searchText = numbersOnly;
      if (input) {
        input.value = numbersOnly;
      }
      return;
    }

    // Fallback to Navigator Clipboard API if available (async)
    if (
      navigator.clipboard &&
      typeof navigator.clipboard.readText === "function"
    ) {
      // do not prevent default here; we'll update the value when we get the clipboard text
      navigator.clipboard
        .readText()
        .then((text) => {
          const numbersOnly = (text || "").replace(/\D/g, "").slice(0, 5);
          this.searchText = numbersOnly;
          if (input) input.value = numbersOnly;
        })
        .catch(() => {
          // If fallback fails, sanitize the input after the paste event
          setTimeout(() => {
            const val = (input?.value || "").replace(/\D/g, "").slice(0, 5);
            this.searchText = val;
            if (input) input.value = val;
          }, 0);
        });
      return;
    }

    // Last-resort: allow default paste and sanitize immediately after
    setTimeout(() => {
      const val = (input?.value || "").replace(/\D/g, "").slice(0, 5);
      this.searchText = val;
      if (input) input.value = val;
    }, 0);
  }

  onInputChange(): void {
    // Keep only numeric characters and limit to max 5 digits
    this.searchText = (this.searchText || "").replace(/\D/g, "").slice(0, 5);
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    this.searchAddress();
  }

  searchAddress(): void {
    if (!this.searchText || this.isSearching) {
      return;
    }

    // Debounce to prevent multiple rapid calls
    const now = Date.now();
    if (now - this.lastSearchTime < 1000) {
      return;
    }
    this.lastSearchTime = now;

    if (!this.isInAllowedRoutes()) {
      this.toastService.aviso(
        "Search is only available in the application area"
      );
      return;
    }

    if (!this.isValidZipCode(this.searchText)) {
      this.toastService.erro("Please enter a valid 5-digit ZIP code");
      return;
    }

    this.isSearching = true;
    console.log(
      "Starting search for ZIP code:",
      this.searchText,
      "Instance ID:",
      this.instanceId
    );

    this.searchMonitorsService
      .findByZipCode(this.searchText)
      .then((monitors: MapPoint[]) => {
        this.isSearching = false;
        this.monitorsFound.emit(monitors);

        // Only show success toast if monitors were found
        if (monitors && monitors.length > 0) {
          this.toastService.sucesso(
            `Found ${monitors.length} monitors near ZIP code ${this.searchText}`
          );
        }

        // Clear the search input after search
        this.searchText = "";

        // Error toast is handled by the service error$ observable
      })
      .catch((error) => {
        this.isSearching = false;
        this.monitorsFound.emit([]);

        // Clear the search input even on error
        this.searchText = "";

        // Error toast is handled by the service error$ observable
      });
  }

  private isValidZipCode(zipCode: string): boolean {
    // Accept between 1 and 5 digits (minimum 1, maximum 5)
    const zipRegex = /^\d{1,5}$/;
    return zipRegex.test(zipCode);
  }

  isLogado(): boolean {
    return this.authentication.isTokenValido();
  }

  isInAllowedRoutes(): boolean {
    const currentRoute = this.router.url;
    // Only show on exact routes: /client, /admin, or root /
    return (
      currentRoute === "/client" ||
      currentRoute === "/admin" ||
      currentRoute === "/"
    );
  }

  private checkRouteVisibility(): void {
    const currentRoute = this.router.url;
    this.showSearchSection =
      currentRoute.includes("/client") || currentRoute.includes("/admin");
    console.log(
      "Route visibility check:",
      currentRoute,
      "Show search section:",
      this.showSearchSection
    );
  }
}
