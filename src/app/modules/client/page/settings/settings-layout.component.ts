import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SettingsSideBarComponent } from '@app/shared/components/settings-side-bar/settings-side-bar.component';

@Component({
  selector: 'app-settings-layout',
  templateUrl: './settings-layout.component.html',
  styleUrls: ['./settings-layout.component.scss'],
  standalone: true,
  imports: [RouterModule, SettingsSideBarComponent]
})
export class SettingsLayoutComponent {}
