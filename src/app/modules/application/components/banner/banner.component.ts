import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconsModule } from '@app/shared/icons/icons.module';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  standalone: true,
  imports: [IconsModule, NgClass],
})
export class BannerComponent {
  adExamples = [
    {
      title: "Fresh Coffee Daily",
      subtitle: "Café Premium",
      cta: "Order Now - 20% Off",
      gradient: "from-amber-600 to-orange-700",
      category: "Food & Beverage"
    },
    {
      title: "Summer Fashion Sale",
      subtitle: "Up to 70% Off",
      cta: "Shop Today",
      gradient: "from-pink-500 to-rose-600",
      category: "Fashion & Retail"
    },
    {
      title: "Tech Solutions",
      subtitle: "AI-Powered Business",
      cta: "Get Free Quote",
      gradient: "from-blue-600 to-purple-700",
      category: "Technology"
    }
  ];

  constructor(private readonly router: Router) {}

  onStartAdvertising() {
    this.router.navigate(['/register']);
  }
}
