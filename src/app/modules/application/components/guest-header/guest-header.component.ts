import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { ToggleModeService } from "@app/core/service/state/toggle-mode.service";
import { LoginEntryService } from "@app/shared/services/login-entry.service";
import { ToggleComponent } from "@app/shared/components/toogle/toogle.component";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-guest-header",
  templateUrl: "./guest-header.component.html",
  styleUrls: ["./guest-header.component.scss"],
  standalone: true,
  imports: [IconsModule, ToggleComponent, AsyncPipe],
})
export class GuestHeaderComponent {
  constructor(
    private readonly router: Router,
    readonly toggleMode: ToggleModeService,
    private readonly loginEntryService: LoginEntryService
  ) {}

  onLogin(): void {
    this.loginEntryService.openLoginTypePicker();
  }

  onRegister() {
    this.router.navigate(["/register"]);
  }

  navLinks = [
    { section: "#map-search", label: "Screens" },
    { section: "#how-it-works", label: "How It Works" },
    { section: "#features", label: "Features" },
    { section: "#contact", label: "Contact" },
  ];
}
