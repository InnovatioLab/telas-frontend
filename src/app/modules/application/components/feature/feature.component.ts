import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss']
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
