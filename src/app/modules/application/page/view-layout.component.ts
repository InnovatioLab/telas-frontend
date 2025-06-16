import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GuestHeaderComponent } from '../components/guest-header/guest-header.component';
import { GuestFooterComponent } from '../components/guest-footer/guest-footer.component';
import { MapperAnimateComponent } from '../components/mapper-animate/mapper-animate.component';
import { HowItWorksComponent } from '../components/how-it-works/how-it-works.component';
import { HeroComponent } from '../components/hero/hero.component';
import { FeatureComponent } from '../components/feature/feature.component';

@Component({
  selector: 'app-view-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GuestHeaderComponent,
    GuestFooterComponent,
    MapperAnimateComponent,
    HowItWorksComponent,
    HeroComponent,
    FeatureComponent
  ],
  templateUrl: './view-layout.component.html',
  styleUrls: ['./view-layout.component.scss']
})
export class ViewLayoutComponent  {

  constructor() {}

}
