import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface HowItWorksSubItem {
  label: string;
  variant?: 'default' | 'success';
}

export interface HowItWorksStep {
  number: number;
  title: string;
  subItems?: HowItWorksSubItem[];
}

@Component({
  selector: 'app-how-it-works',
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class HowItWorksComponent {
  readonly steps: HowItWorksStep[] = [
    {
      number: 1,
      title: 'Customer Sign Up',
    },
    {
      number: 2,
      title: 'Search by ZIP Code & Select Screens',
    },
    {
      number: 3,
      title: 'Upload Logo & Files, Complete Questionnaire, Request Ad',
      subItems: [
        { label: 'Upload Logo & Files' },
        { label: 'Complete Questionnaire' },
        { label: 'Request Ad' },
      ],
    },
    {
      number: 4,
      title: 'Ad Created',
    },
    {
      number: 5,
      title: 'Ad Approved by Customer',
      subItems: [
        { label: 'Review Ad' },
        { label: 'Approve Ad' },
        { label: 'Approved', variant: 'success' },
      ],
    },
    {
      number: 6,
      title: 'Ad Display on Selected Screens',
    },
  ];

  constructor(private readonly router: Router) {}

  onStartCampaign(): void {
    this.router.navigate(['/register']);
  }
}
