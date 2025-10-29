import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { AdRequestManagementComponent } from '../ad-request-management/ad-request-management.component';
import { AdsManagementComponent } from '../ads-management/ads-management.component';

@Component({
  selector: 'app-management-advertisements',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    AdRequestManagementComponent,
    AdsManagementComponent
  ],
  templateUrl: './management-advertisements.component.html',
  styleUrls: ['./management-advertisements.component.scss']
})
export class ManagementAdvertisementsComponent {
  
} 