import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { BannerComponent } from "../components/banner/banner.component";
import { FeatureComponent } from "../components/feature/feature.component";
import { GuestFooterComponent } from "../components/guest-footer/guest-footer.component";
import { GuestHeaderComponent } from "../components/guest-header/guest-header.component";
import { HeroComponent } from "../components/hero/hero.component";
import { HowItWorksComponent } from "../components/how-it-works/how-it-works.component";

@Component({
  selector: "app-guest-lading",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    GuestFooterComponent,
    HowItWorksComponent,
    HeroComponent,
    FeatureComponent,
    BannerComponent,
  ],
  templateUrl: "./guest-lading.component.html",
  styleUrls: ["./guest-lading.component.scss"],
})
export class GuestLadingComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
