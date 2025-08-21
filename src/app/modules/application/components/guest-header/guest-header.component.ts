import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-guest-header",
  templateUrl: "./guest-header.component.html",
  styleUrls: ["./guest-header.component.scss"],
  standalone: true,
  imports: [IconsModule],
})
export class GuestHeaderComponent {
  constructor(private readonly router: Router) {}

  onLogin() {
    this.router.navigate(["/auth/login"]);
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
