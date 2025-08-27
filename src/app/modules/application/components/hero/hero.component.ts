import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconsModule } from '@app/shared/icons/icons.module';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss'],
  standalone: true,
  imports: [IconsModule, PrimengModule],
})
export class HeroComponent {
  constructor(private readonly router: Router) {}

  onGetStarted() {
    this.router.navigate(['/register']);
  }

  onLearnMore() {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
