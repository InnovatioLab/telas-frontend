import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { AdRequestManagementComponent } from '../ad-request-management/ad-request-management.component';
import { AdsManagementComponent } from '../ads-management/ads-management.component';

@Component({
  selector: 'app-management-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    AdRequestManagementComponent,
    AdsManagementComponent
  ],
  templateUrl: './management-advertisements.component.html',
  styleUrls: ['./management-advertisements.component.scss']
})
export class ManagementAdvertisementsComponent {
  activeTab: string | number = 'requests';
  requestsOriginTab: 'CLIENT' | 'PARTNER' = 'CLIENT';
} 