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

  navigateToSection(section: string) {
    const currentUrl = this.router.url;

    if (
      currentUrl === "/" ||
      currentUrl === "" ||
      currentUrl.startsWith("/#")
    ) {
      this.scrollToSection(section);
    } else {
      this.router
        .navigate(["/"], {
          fragment: section,
          queryParamsHandling: "preserve",
        })
        .then(() => {
          setTimeout(() => {
            this.scrollToSection(section);
          }, 200);
        });
    }
  }

  private scrollToSection(section: string) {
    const element = document.getElementById(section);
    if (element) {
      // Calcular offset para header fixo
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
  }

  navLinks = [
    { section: "map-search", label: "Find Screens" },
    { section: "how-it-works", label: "How It Works" },
    { section: "features", label: "Features" },
    { section: "contact", label: "Contact" },
  ];
}
