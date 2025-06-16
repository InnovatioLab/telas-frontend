import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimengModule } from '@app/shared/primeng/primeng.module';
import { Router } from '@angular/router';
import { IconsModule } from '@app/shared/icons/icons.module';

interface ScreenStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance';
  infra: {
    ip: string;
    mac: string;
    location: string;
  };
  connectivity: {
    internet: boolean;
    lastCheck: string;
  };
}

@Component({
  selector: 'app-box-status',
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule],
  templateUrl: './box-status.component.html',
  styleUrls: ['./box-status.component.scss']
})
export class BoxStatusComponent {
  screens: ScreenStatus[] = [
    {
      id: '1',
      name: 'Screen 1',
      status: 'online',
      infra: { ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', location: 'Reception' },
      connectivity: { internet: true, lastCheck: '2 min ago' }
    },
    {
      id: '2',
      name: 'Screen 2',
      status: 'offline',
      infra: { ip: '192.168.1.11', mac: 'AA:BB:CC:DD:EE:02', location: 'Meeting Room' },
      connectivity: { internet: false, lastCheck: '10 min ago' }
    },
    {
      id: '3',
      name: 'Screen 3',
      status: 'maintenance',
      infra: { ip: '192.168.1.12', mac: 'AA:BB:CC:DD:EE:03', location: 'Lobby' },
      connectivity: { internet: true, lastCheck: 'just now' }
    }
  ];

  menuOptions = [
    { label: 'Panel View', key: 'panel', icon: 'tv-display' },
    { label: 'Ads', key: 'ads', icon: 'shopping-basket' }
  ];

  selectedScreen: ScreenStatus = this.screens[0];
  selectedMenu: string = 'panel';

  constructor(private readonly router: Router) {}

  selectScreen(screen: ScreenStatus) {
    this.selectedScreen = screen;
    this.selectedMenu = 'panel';
  }

  selectMenu(key: string) {
    this.selectedMenu = key;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  }

  logout() {
    this.router.navigate(['/boxes/login']);
  }
}