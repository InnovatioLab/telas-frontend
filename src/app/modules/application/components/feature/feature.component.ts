import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss'],
  standalone: true,
  imports: [IconsModule],
})
export class FeatureComponent {
  constructor(private readonly router: Router) {}

  onGetStarted() {
    this.router.navigate(['/register']);
  }

  onSignIn() {
    this.router.navigate(['/login']);
  }
}
