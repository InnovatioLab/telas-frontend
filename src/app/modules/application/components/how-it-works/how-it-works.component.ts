import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
  standalone: true,
  imports: [IconsModule],
})
export class HowItWorksComponent {
  constructor(private readonly router: Router) {}

  onStartCampaign() {
    this.router.navigate(['/register']);
  }
}
