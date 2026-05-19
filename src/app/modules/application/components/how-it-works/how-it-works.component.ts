import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HowItWorksStep } from './how-it-works.types';
import { HowItWorksFlowIconComponent } from './how-it-works-flow-icon/how-it-works-flow-icon.component';

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
  standalone: true,
  imports: [CommonModule, HowItWorksFlowIconComponent],
})
export class HowItWorksComponent {
  readonly steps: HowItWorksStep[] = [
    {
      number: 1,
      title: 'Customer Sign Up',
      imageSrc: 'assets/img/step1_create_account_monitor.png',
      imageWhiteFrame: true,
    },
    {
      number: 2,
      title: 'Search by ZIP Code & Select Screens',
      imageSrc: 'assets/img/step2_search_and_select_screens.png',
      imageWhiteFrame: true,
    },
    {
      number: 3,
      title: 'Upload Logo & Files, Complete Questionnaire, Request Ad',
      subItems: [
        { label: 'Upload Logo & Files', icon: 'upload' },
        { label: 'Complete Questionnaire', icon: 'clipboard' },
        { label: 'Request Ad', icon: 'send' },
      ],
    },
    {
      number: 4,
      title: 'Ad Created',
      imageSrc: 'assets/img/step4_ad_created_monitor.png',
      imageMonitor: true,
    },
    {
      number: 5,
      title: 'Ad Approved by Customer',
      subItems: [
        { label: 'Review Ad', icon: 'eye' },
        { label: 'Approve Ad', icon: 'check' },
        { label: 'Approved', icon: 'check-success' },
      ],
    },
    {
      number: 6,
      title: 'Ad Display on Selected Screens',
      imageSrc: 'assets/img/TELAS_Supermarket_Image.png',
      imageCover: true,
    },
  ];

  constructor(private readonly router: Router) {}

  onStartCampaign(): void {
    this.router.navigate(['/register']);
  }
}
