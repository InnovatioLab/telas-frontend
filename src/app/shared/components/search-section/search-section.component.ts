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
import { Router } from "@angular/router";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { LayoutService } from "@app/core/service/state/layout.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { IconSearchComponent } from "@app/shared/icons/search.icon";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { Subscription } from "rxjs";

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
  private errorSubscription: Subscription;
  private lastSearchTime = 0;
  private instanceId = Math.random().toString(36).substr(2, 9);

  ngOnInit(): void {
    this.errorSubscription = this.searchMonitorsService.error$.subscribe(
      (error) => {
        if (error) {
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

    if (
      !/[0-9]/.test(event.key) &&
      !["Backspace", "Delete", "Tab", "Enter"].includes(event.key)
    ) {
      event.preventDefault();
    }

    if (
      value.length >= 5 &&
      !["Backspace", "Delete", "Tab", "Enter"].includes(event.key)
    ) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste = (
      event.clipboardData || (window as any).clipboardData
    ).getData("text");
    const numbersOnly = paste.replace(/[^0-9]/g, "").substring(0, 5);
    this.searchText = numbersOnly;
  }

  onInputChange(): void {
    this.searchText = this.searchText.replace(/[^0-9]/g, "");
  }

  onEnterKey(event: Event): void {
    event.preventDefault();
    this.searchAddress();
  }

  searchAddress(): void {
    if (!this.searchText || this.isSearching) {
      return;
    }

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

    this.searchMonitorsService
      .findByZipCode(this.searchText)
      .then((monitors: MapPoint[]) => {
        this.isSearching = false;
        this.monitorsFound.emit(monitors);

        if (monitors && monitors.length > 0) {
          this.toastService.sucesso(
            `Found ${monitors.length} monitors near ZIP code ${this.searchText}`
          );
        }
      })
      .catch(() => {
        this.isSearching = false;
        this.monitorsFound.emit([]);
      });
  }

  private isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
  }

  isLogado(): boolean {
    return this.authentication.isTokenValido();
  }

  isInAllowedRoutes(): boolean {
    const currentRoute = this.router.url;
    return currentRoute.includes("/client") || currentRoute === "/";
  }
}
