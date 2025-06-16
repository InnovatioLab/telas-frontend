import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { GuestHeaderComponent } from '../components/guest-header/guest-header.component';
import { GuestFooterComponent } from '../components/guest-footer/guest-footer.component';
import { MapperAnimateComponent } from '../components/mapper-animate/mapper-animate.component';
import { HowItWorksComponent } from '../components/how-it-works/how-it-works.component';
import { HeroComponent } from '../components/hero/hero.component';
import { FeatureComponent } from '../components/feature/feature.component';
import { BannerComponent } from "../components/banner/banner.component";

@Component({
  selector: 'app-guest-lading',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    GuestFooterComponent,
    MapperAnimateComponent,
    HowItWorksComponent,
    HeroComponent,
    FeatureComponent,
    BannerComponent
  ],
  templateUrl: './guest-lading.component.html',
  styleUrls: ['./guest-lading.component.scss']
})
export class GuestLadingComponent implements OnInit {

  constructor() {
    console.log('GuestLadingComponent constructor');
  }

  ngOnInit(): void {
    console.log('GuestLadingComponent inicializado');
  }
}
