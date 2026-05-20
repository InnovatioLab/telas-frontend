import { AsyncPipe } from "@angular/common";
import { Component, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { ToggleModeService } from "@app/core/service/state/toggle-mode.service";
import {
  LoginEntryMode,
  LoginEntryService,
} from "@app/shared/services/login-entry.service";
import { ToggleComponent } from "@app/shared/components/toogle/toogle.component";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { MenuItem } from "primeng/api";
import { Menu } from "primeng/menu";

@Component({
  selector: "app-guest-header",
  templateUrl: "./guest-header.component.html",
  styleUrls: ["./guest-header.component.scss"],
  standalone: true,
  imports: [IconsModule, ToggleComponent, AsyncPipe, PrimengModule],
})
export class GuestHeaderComponent {
  @ViewChild("loginMenu") loginMenu!: Menu;

  loginMenuItems: MenuItem[] = [];

  constructor(
    private readonly router: Router,
    readonly toggleMode: ToggleModeService,
    private readonly loginEntryService: LoginEntryService
  ) {
    this.loginMenuItems = [
      {
        label: "Login Client",
        icon: "pi pi-user",
        command: () => this.goToLogin("client"),
      },
      {
        label: "Login Partner",
        icon: "pi pi-briefcase",
        command: () => this.goToLogin("partner"),
      },
    ];
  }

  toggleLoginMenu(event: Event): void {
    this.loginMenu.toggle(event);
  }

  private goToLogin(mode: LoginEntryMode): void {
    this.loginEntryService.navigateToLogin(mode);
  }

  onRegister(): void {
    this.router.navigate(["/register"]);
  }

  navLinks = [
    { section: "#map-search", label: "Screens" },
    { section: "#how-it-works", label: "How It Works" },
    { section: "#features", label: "Features" },
    { section: "#contact", label: "Contact" },
  ];
}
