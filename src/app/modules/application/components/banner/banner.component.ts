import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-banner",
  templateUrl: "./banner.component.html",
  styleUrls: ["./banner.component.scss"],
  standalone: true,
  imports: [CommonModule, IconsModule],
})
export class BannerComponent {
  adExamples = [
    {
      category: "Fresh Coffee Daily",
      image: "assets/img/coffee-shop.svg",
    },
    {
      category: "Healthy Living",
      image: "assets/img/doctor.jpg",
    },
    {
      category: "Pet Care Essentials",
      image: "assets/img/dog.jpg",
    },
  ];

  constructor(private readonly router: Router) {}

  onStartAdvertising() {
    this.router.navigate(["/register"]);
  }

  trackByIndex(index: number) {
    return index;
  }
}
