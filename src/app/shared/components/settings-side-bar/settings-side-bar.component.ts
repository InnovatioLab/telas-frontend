import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconBackComponent } from '@app/shared/icons/back.icon';
import { IconHomeComponent } from '@app/shared/icons/home.icon';
import { IconLockComponent } from '@app/shared/icons/lock.icon';
import { IconPlaceComponent } from '@app/shared/icons/place.icon';
import { IconCreditCardComponent } from '@app/shared/icons/credit-card.icon';

interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-settings-side-bar',
  templateUrl: './settings-side-bar.component.html',
  styleUrls: ['./settings-side-bar.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    IconBackComponent,
  ]
})
export class SettingsSideBarComponent {
  menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Personal Data',
      route: 'profile',
      icon: 'user'
    },
    {
      id: 'password',
      label: 'Change Password',
      route: 'change-password',
      icon: 'key'
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      route: 'subscriptions',
      icon: 'credit-card'
    },
  ];

  activeMenuItem: string = 'profile';

  constructor(private readonly router: Router) {}

  setActiveMenuItem(menuId: string): void {
    this.activeMenuItem = menuId;
  }

  goBack(): void {
    this.router.navigate(['/client']);
  }
  
  getIconComponent(iconName: string): any {
    const iconMap: {[key: string]: any} = {
      'user': IconHomeComponent,
      'key': IconLockComponent,
      'chart': IconPlaceComponent,
      'credit-card': IconCreditCardComponent
    };
    
    return iconMap[iconName] ?? null;
  }
}
