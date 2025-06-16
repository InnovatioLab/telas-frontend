import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss']
})
export class HowItWorksComponent {
  constructor(private readonly router: Router) {}

  onStartCampaign() {
    this.router.navigate(['/register']);
  }
}
